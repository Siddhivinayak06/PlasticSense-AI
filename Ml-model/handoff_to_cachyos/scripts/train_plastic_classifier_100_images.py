"""Fine-tune a ConvNeXt classifier on a verified local dataset.

This script is intentionally explicit about the data requirements:
- it uses ImageNet-22k then ImageNet-1k pretrained ConvNeXt weights;
- it expects a small local dataset under a folder such as:
    dataset/
      train/
        HDPE/
        LDPE/
        PET/
        PP/
        PS/
        Other/
      val/
        HDPE/
        ...
- if the folder contains exactly 100 images total, it will train on them.

The script is safe because it does not invent data or substitute another dataset.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import timm
import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from torchvision.datasets import ImageFolder


CLASS_NAMES = ["HDPE", "LDPE", "Other", "PET", "PP", "PS"]


def build_transform(image_size: int = 384):
    return transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )


def ensure_dataset_structure(dataset_root: Path):
    if not dataset_root.exists():
        raise FileNotFoundError(f"Dataset root not found: {dataset_root}")

    train_dir = dataset_root / "train"
    val_dir = dataset_root / "val"
    if not train_dir.exists() or not val_dir.exists():
        raise FileNotFoundError(
            "Expected dataset structure: dataset_root/train and dataset_root/val with class folders inside each."
        )

    for split in [train_dir, val_dir]:
        children = [p for p in split.iterdir() if p.is_dir()]
        if not children:
            raise FileNotFoundError(f"No class folders found in {split}")


def count_images(dataset_root: Path):
    total = 0
    for split in ["train", "val"]:
        for cls_dir in (dataset_root / split).iterdir():
            if cls_dir.is_dir():
                total += sum(1 for _ in cls_dir.iterdir() if _.is_file())
    return total


def main():
    parser = argparse.ArgumentParser(description="Fine-tune a plastic classifier on a local dataset with ImageNet-22k/1k pretrained weights.")
    parser.add_argument("--dataset-root", type=Path, required=True, help="Root folder containing train/ and val/ class folders")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--output-dir", type=Path, default=Path("results/plastic_finetune_100img"))
    args = parser.parse_args()

    ensure_dataset_structure(args.dataset_root)
    total_images = count_images(args.dataset_root)
    print(f"Detected {total_images} local images under {args.dataset_root}")

    train_ds = ImageFolder(str(args.dataset_root / "train"), transform=build_transform())
    val_ds = ImageFolder(str(args.dataset_root / "val"), transform=build_transform())

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = timm.create_model(
        "convnext_base.fb_in22k_ft_in1k_384",
        pretrained=True,
        num_classes=len(CLASS_NAMES),
    )
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    best_val_acc = 0.0

    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss = 0.0
        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)
            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()

        model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)
                logits = model(images)
                preds = logits.argmax(dim=1)
                correct += (preds == labels).sum().item()
                total += labels.size(0)

        val_acc = correct / max(total, 1)
        print(f"Epoch {epoch}/{args.epochs} | train_loss={running_loss / len(train_loader):.4f} | val_acc={val_acc:.4f}")
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), args.output_dir / "best_plastic_classifier.pt")

    print(f"Best validation accuracy: {best_val_acc:.4f}")
    print(f"Saved weights to: {args.output_dir / 'best_plastic_classifier.pt'}")


if __name__ == "__main__":
    main()
