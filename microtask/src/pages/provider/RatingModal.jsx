import { useState } from "react";
import "./RatingModal.css";

const RatingModal = ({ task, onClose, onReviewSubmitted }) => {

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState(null);
  const [hover, setHover] = useState(0);

  const submitReview = async () => {

    if (rating < 1 || rating > 5) {
      alert("Please select a rating between 1 and 5");
      return;
    }

    const formData = new FormData();

    formData.append("workerId", task.assignedWorker._id);
    formData.append("rating", rating);
    formData.append("comment", comment);
    formData.append("taskId", task._id);
    formData.append("skill", task.requiredSkill);

    if (image) {
      formData.append("image", image);
    }

    const res = await fetch(
      "http://localhost:5000/api/reviews/add",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
      }
    );

    const data = await res.json();
if (res.ok) {

  const data = await res.json();

  alert("Rating submitted successfully");

  // notify parent component
  if (task.onReviewSubmitted) {
    task.onReviewSubmitted();
  }

  onClose();
}
    else {
      alert(data.message);
    }

  };

  return (

    <div className="rating-overlay">

      <div className="rating-box">

        <h3>Rate the Worker</h3>

        {/* ⭐ STAR RATING */}
        <div className="stars">

          {[1,2,3,4,5].map((star) => (

            <span
              key={star}
              className={
                star <= (hover || rating)
                  ? "star active"
                  : "star"
              }
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              ★
            </span>

          ))}

        </div>

        {/* REVIEW TEXT */}
        <textarea
          placeholder="Write review (optional)"
          value={comment}
          onChange={(e)=>setComment(e.target.value)}
        />

        {/* IMAGE UPLOAD */}
        <div className="image-upload">

          <label>Upload work image (optional)</label>

          <input
            type="file"
            accept="image/*"
            onChange={(e)=>setImage(e.target.files[0])}
          />

        </div>

        {/* ACTION BUTTONS */}
        <div className="rating-actions">

          <button
            className="submit-btn"
            disabled={rating === 0}
            onClick={submitReview}
          >
            Submit
          </button>

          <button
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

        </div>

      </div>

    </div>

  );
};

export default RatingModal;