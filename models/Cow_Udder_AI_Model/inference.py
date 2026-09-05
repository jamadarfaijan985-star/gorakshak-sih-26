from ultralytics import YOLO

MODEL_PATH = "best.pt"

model = YOLO(MODEL_PATH)


def predict(image_path):
    results = model.predict(
        source=image_path,
        imgsz=224,
        device="cpu",
        verbose=False
    )

    result = results[0]

    class_id = result.probs.top1
    confidence = float(result.probs.top1conf)
    label = result.names[class_id]

    return {
        "class_id": int(class_id),
        "prediction": label,
        "confidence": round(confidence, 4)
    }


if __name__ == "__main__":

    output = predict("test_normal.jpg")

    print("Prediction:", output["prediction"])
    print("Class ID:", output["class_id"])
    print("Confidence:", output["confidence"])