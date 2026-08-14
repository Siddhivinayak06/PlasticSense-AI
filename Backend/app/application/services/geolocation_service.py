import io
from typing import Dict, Any, Optional
from PIL import Image
import re
from PIL.ExifTags import TAGS, GPSTAGS
from app.core.logging import logger

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

def get_exif_data(image_bytes: bytes) -> Dict[str, Any]:
    """Extract EXIF data from image bytes."""
    exif_data = {}
    try:
        image = Image.open(io.BytesIO(image_bytes))
        info = image._getexif()
        if info:
            for tag, value in info.items():
                decoded = TAGS.get(tag, tag)
                if decoded == "GPSInfo":
                    gps_data = {}
                    for t in value:
                        sub_decoded = GPSTAGS.get(t, t)
                        gps_data[sub_decoded] = value[t]
                    exif_data[decoded] = gps_data
                else:
                    exif_data[decoded] = value
    except Exception as e:
        logger.warning(f"Failed to extract EXIF data: {e}")
    return exif_data

def convert_to_degrees(value) -> float:
    """Helper function to convert the GPS coordinates stored in the EXIF to degress in float format"""
    try:
        d = float(value[0])
        m = float(value[1])
        s = float(value[2])
        return d + (m / 60.0) + (s / 3600.0)
    except Exception:
        return 0.0

def extract_gps_from_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Extract GPS location from image bytes.
    Returns dictionary with has_location, latitude, longitude, and source.
    """
    result = {
        "has_location": False,
        "latitude": None,
        "longitude": None,
        "source": None
    }
    
    exif_data = get_exif_data(image_bytes)
    gps_info = exif_data.get("GPSInfo")
    
    if gps_info:
        try:
            gps_latitude = gps_info.get("GPSLatitude")
            gps_latitude_ref = gps_info.get("GPSLatitudeRef")
            gps_longitude = gps_info.get("GPSLongitude")
            gps_longitude_ref = gps_info.get("GPSLongitudeRef")

            if gps_latitude and gps_latitude_ref and gps_longitude and gps_longitude_ref:
                lat = convert_to_degrees(gps_latitude)
                if gps_latitude_ref != "N":
                    lat = -lat
                    
                lon = convert_to_degrees(gps_longitude)
                if gps_longitude_ref != "E":
                    lon = -lon

                if -90 <= lat <= 90 and -180 <= lon <= 180:
                    result["has_location"] = True
                    result["latitude"] = lat
                    result["longitude"] = lon
                    result["source"] = "image_exif"
                    result["confidence"] = 1.0
        except Exception as e:
            logger.warning(f"Error parsing GPS data: {e}")

    # Fallback to OCR if no valid EXIF GPS found
    if not result["has_location"] and HAS_TESSERACT:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(image)
            
            # Example patterns: 
            # "Lat 19.182451° Long 73.140135°"
            # "Latitude: 19.182451 Longitude: 73.140135"
            # "Lat 19.182451° N Long 73.140135° E"
            
            # Very flexible regex for extracting lat/lon
            lat_pattern = r"(?:lat|latitude)[\s:=]*(-?\d+\.\d+)"
            lon_pattern = r"(?:long|longitude|lon)[\s:=]*(-?\d+\.\d+)"
            
            lat_match = re.search(lat_pattern, text, re.IGNORECASE)
            lon_match = re.search(lon_pattern, text, re.IGNORECASE)
            
            if lat_match and lon_match:
                lat = float(lat_match.group(1))
                lon = float(lon_match.group(1))
                
                # Further refine with N/S, E/W indicators if they exist nearby
                # But typically they are positive unless negative is printed.
                # Just checking valid ranges
                if -90 <= lat <= 90 and -180 <= lon <= 180:
                    result["has_location"] = True
                    result["latitude"] = lat
                    result["longitude"] = lon
                    result["source"] = "image_overlay_ocr"
                    result["confidence"] = 0.90
                    logger.info(f"Extracted GPS via OCR: {lat}, {lon}")
        except Exception as e:
            logger.warning(f"Error during OCR GPS extraction: {e}")

    return result
