'use client';

import { useState, useEffect } from 'react';
import { useCustomerAuth } from '../lib/customer-auth-context';
import * as customerClient from '../lib/customer-client';
import type { ProductReview, ProductReviewStats } from '../lib/customer-client';
import { AuthModal } from './auth-modal';

interface ProductReviewsSectionProps {
  productId: string;
}

export function ProductReviewsSection({ productId }: ProductReviewsSectionProps) {
  const { isAuthenticated } = useCustomerAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState<ProductReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add review form
  const [showAddReview, setShowAddReview] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  async function loadReviews() {
    setLoading(true);
    try {
      const result = await customerClient.listProductReviews(productId);
      setReviews(result.reviews);
      setStats(result.stats);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const reviewInput: { productId: string; rating: number; comment?: string } = {
        productId,
        rating,
      };
      if (comment) {
        reviewInput.comment = comment;
      }
      const review = await customerClient.createReview(reviewInput);
      setReviews([review, ...reviews]);
      setShowAddReview(false);
      setRating(5);
      setComment('');
      // Reload stats
      const result = await customerClient.listProductReviews(productId);
      setStats(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إضافة التقييم');
    } finally {
      setSubmitting(false);
    }
  }

  function renderStars(rating: number, interactive = false) {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={interactive ? () => setRating(star) : undefined}
            role={interactive ? 'button' : undefined}
            aria-label={interactive ? `${star} stars` : undefined}
          >
            {star <= rating ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  }

  return (
    <section className="section reviews-section">
      <div className="reviews-header">
        <h2>التقييمات والمراجعات</h2>
        <button
          className="button-primary"
          onClick={() => {
            if (!isAuthenticated) {
              setShowAuthModal(true);
            } else {
              setShowAddReview(!showAddReview);
            }
          }}
        >
          {showAddReview ? 'إلغاء' : 'أضف تقييمك'}
        </button>
      </div>

      {/* Stats */}
      {stats && stats.totalReviews > 0 && (
        <div className="reviews-stats">
          <div className="reviews-average">
            <span className="average-number">{stats.averageRating.toFixed(1)}</span>
            {renderStars(Math.round(stats.averageRating))}
            <span className="total-reviews">{stats.totalReviews} تقييم</span>
          </div>
          <div className="rating-bars">
            {stats.ratingDistribution.map(({ rating: r, count }) => (
              <div key={r} className="rating-bar-row">
                <span className="rating-label">{r} ★</span>
                <div className="rating-bar">
                  <div
                    className="rating-bar-fill"
                    style={{ width: `${(count / stats.totalReviews) * 100}%` }}
                  />
                </div>
                <span className="rating-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Review Form */}
      {showAddReview && (
        <form onSubmit={handleSubmitReview} className="add-review-form">
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <label>التقييم</label>
            {renderStars(rating, true)}
          </div>
          <div className="form-group">
            <label htmlFor="review-comment">التعليق (اختياري)</label>
            <textarea
              id="review-comment"
              className="input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="شاركنا رأيك في المنتج..."
              maxLength={1000}
            />
          </div>
          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </button>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <p>جاري تحميل التقييمات...</p>
      ) : reviews.length === 0 ? (
        <p className="muted">لا توجد تقييمات لهذا المنتج بعد. كن أول من يقيمه!</p>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-meta">
                <span className="reviewer-name">{review.customerName}</span>
                {review.isVerifiedPurchase && (
                  <span className="verified-badge">شراء موثق</span>
                )}
              </div>
              <div className="review-rating-row">
                {renderStars(review.rating)}
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString('ar')}
                </span>
              </div>
              {review.comment && <p className="review-comment">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </section>
  );
}
