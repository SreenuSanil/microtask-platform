import { useEffect, useState } from "react";
import "./WorkerRatings.css";

const WorkerRatings = () => {

  const [reviews, setReviews] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [previewImage, setPreviewImage] = useState(null);
const fetchData = async () => {

  const res = await fetch(
    "http://localhost:5000/api/auth/me",
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }
  );

  const data = await res.json();

  setReviews(data.reviews || []);
  setSkills(data.skillRatings || []);
};

useEffect(() => {
  fetchData();
}, []);

  const filteredReviews =
    selectedSkill === "all"
      ? reviews
      : reviews.filter(
          r => r.skill?.toLowerCase() === selectedSkill.toLowerCase()
        );

  return (

    <div className="ratings-container">

      <h2 className="ratings-title">Ratings & Reviews</h2>

      {/* Skill Filter */}
      <div className="skill-filter">

        <button
          className={selectedSkill === "all" ? "active" : ""}
          onClick={() => setSelectedSkill("all")}
        >
          All
        </button>

        {skills.map(skill => (
          <button
            key={skill.skill}
            className={selectedSkill === skill.skill ? "active" : ""}
            onClick={() => setSelectedSkill(skill.skill)}
          >
            {skill.skill}
          </button>
        ))}

      </div>

      {/* Skill Rating Summary */}
      <div className="skill-summary">

        {skills.map(skill => {

          if (skill.ratingCount === 0) return null;

          const safeAvg = Math.max(
            0,
            Math.min(5, Math.round(skill.ratingAverage || 0))
          );

          return (

            <div key={skill.skill} className="skill-box">

              <div className="skill-name">
                {skill.skill.toUpperCase()}
              </div>

              <div className="skill-rating">

                {"★".repeat(safeAvg)}
                {"☆".repeat(5 - safeAvg)}

                <span className="rating-value">
                  {skill.ratingAverage ? skill.ratingAverage.toFixed(1) : "0.0"}
                </span>

              </div>

<div className="skill-count">
  {skill.ratingCount} {skill.ratingCount === 1 ? "rating" : "ratings"}
</div>

            </div>

          );

        })}

      </div>

      {/* Reviews List */}
      <div className="reviews-list">

        {filteredReviews.length === 0 ? (
          <p className="no-reviews">No reviews yet.</p>
        ) : (

          filteredReviews.map((r, i) => {

            const safeRating = Math.max(
              0,
              Math.min(5, r.rating || 0)
            );

            return (

<div key={i} className="review-card">

  <div className="review-top">
    <div className="review-stars">
      {"★".repeat(safeRating)}
      {"☆".repeat(5 - safeRating)}
    </div>

    {/* ← move image here, next to stars */}
    {r.image && (
      <img
        src={`http://localhost:5000/${r.image}`}
        alt="review"
        className="review-image"
        onClick={() => setPreviewImage(`http://localhost:5000/${r.image}`)}
      />
    )}

    <span className="review-skill">{r.skill}</span>
  </div>

  {r.comment && (
    <div className="review-comment">{r.comment}</div>
  )}

</div>

            );

          })

        )}

      </div>
 {previewImage && (
    <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
      <img src={previewImage} className="image-preview-large" alt="preview" />
    </div>
  )}


    </div>

  );

};

export default WorkerRatings;