'use client';

import { useEffect, useState } from 'react';
import { useCustomerAuth } from '../lib/customer-auth-context';
import { AuthModal } from './auth-modal';
import type { ProductQuestion } from '../lib/customer-client';
import * as customerClient from '../lib/customer-client';

interface ProductQuestionsSectionProps {
  productId: string;
  enabled: boolean;
}

export function ProductQuestionsSection({ productId, enabled }: ProductQuestionsSectionProps) {
  const { isAuthenticated } = useCustomerAuth();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    loadQuestions().catch(() => undefined);
  }, [enabled, productId]);

  async function loadQuestions() {
    setLoading(true);
    setError(null);
    try {
      const response = await customerClient.listPublicProductQuestions(productId, 20, 0);
      setQuestions(response.items);
    } catch {
      setError('Unable to load product questions right now.');
    } finally {
      setLoading(false);
    }
  }

  async function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = questionText.trim();
    if (!trimmedQuestion) {
      return;
    }

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await customerClient.createProductQuestion(productId, trimmedQuestion);
      setQuestionText('');
      setMessage('Your question was sent and will be published after approval.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to submit question.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!enabled) {
    return null;
  }

  return (
    <section className="section questions-section">
      <h2>Product Questions</h2>
      <p className="muted">Ask before you buy. Questions are reviewed before publishing.</p>

      <form className="stack-sm" onSubmit={submitQuestion}>
        <textarea
          className="input"
          value={questionText}
          onChange={(event) => setQuestionText(event.target.value)}
          placeholder="Write your question about this product..."
          maxLength={1000}
        />
        <button className="button-primary" type="submit" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send question'}
        </button>
      </form>

      {message ? <p className="success-message">{message}</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      {loading ? <p>Loading questions...</p> : null}
      {!loading && questions.length === 0 ? (
        <p className="muted">No published questions yet.</p>
      ) : null}

      {!loading && questions.length > 0 ? (
        <div className="stack-md">
          {questions.map((question) => (
            <article key={question.id} className="panel stack-sm">
              <p>
                <strong>Q:</strong> {question.question}
              </p>
              <p>
                <strong>A:</strong> {question.answer}
              </p>
              <p className="muted">
                {question.answeredAt
                  ? new Date(question.answeredAt).toLocaleDateString()
                  : new Date(question.createdAt).toLocaleDateString()}
              </p>
            </article>
          ))}
        </div>
      ) : null}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </section>
  );
}
