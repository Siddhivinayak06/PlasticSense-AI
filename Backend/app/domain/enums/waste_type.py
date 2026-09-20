from enum import Enum


class WasteType(str, Enum):
    PET_BOTTLE = "PET_bottle"
    PLASTIC_BAG = "plastic_bag"
    FOOD_WRAPPER = "food_wrapper"
    STYROFOAM = "styrofoam"
    MULTILAYER = "multilayer"
    OTHER = "other"
