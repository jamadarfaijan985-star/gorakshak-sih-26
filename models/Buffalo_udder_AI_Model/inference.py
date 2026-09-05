from ultralytics import YOLO

MODEL_PATH = "buffalo_udder_segmentation.pt"

model = YOLO(MODEL_PATH)


def predict(image_path):
    results = model.predict(
        source=image_path,
        imgsz=640,
        conf=0.25,
        device="cpu",
        save=True,
        verbose=False
    )

    result = results[0]

    output = {
        "detected": False,
        "detections": []
    }

    if result.masks is not None:

        output["detected"] = True

        for i in range(len(result.masks)):

            class_id = int(result.boxes.cls[i])
            confidence = float(result.boxes.conf[i])
            class_name = result.names[class_id]

            output["detections"].append({
                "class_id": class_id,
                "class_name": class_name,
                "confidence": round(confidence, 4)
            })

    return output


if __name__ == "__main__":
    result = predict("test_buffalo.jpg")
    print(result)