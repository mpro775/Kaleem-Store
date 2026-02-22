import { useState } from 'react';
import type { MerchantRequester } from '../merchant-dashboard';
import type { Category } from '../types';

interface CategoriesPanelProps {
  request: MerchantRequester;
}

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  parentId: '',
  sortOrder: '0',
  isActive: true,
};

export function CategoriesPanel({ request }: CategoriesPanelProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  async function loadCategories(): Promise<void> {
    setMessage('');
    try {
      const data = await request<Category[]>('/categories', { method: 'GET' });
      setCategories(data ?? []);
      setMessage('Categories loaded');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load categories');
    }
  }

  async function createCategory(): Promise<void> {
    setMessage('');
    try {
      await request('/categories', {
        method: 'POST',
        body: JSON.stringify(buildCategoryPayload(form)),
      });
      setForm(emptyForm);
      await loadCategories();
      setMessage('Category created');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create category');
    }
  }

  async function updateCategory(): Promise<void> {
    if (!selectedId) {
      setMessage('Select a category before updating');
      return;
    }

    setMessage('');
    try {
      await request(`/categories/${selectedId}`, {
        method: 'PUT',
        body: JSON.stringify(buildCategoryPayload(form)),
      });
      await loadCategories();
      setMessage('Category updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update category');
    }
  }

  async function deleteCategory(): Promise<void> {
    if (!selectedId) {
      setMessage('Select a category before deleting');
      return;
    }

    setMessage('');
    try {
      await request(`/categories/${selectedId}`, {
        method: 'DELETE',
      });
      setSelectedId('');
      setForm(emptyForm);
      await loadCategories();
      setMessage('Category deleted');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete category');
    }
  }

  function selectCategory(category: Category): void {
    setSelectedId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      parentId: category.parentId ?? '',
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    });
  }

  return (
    <section className="card-grid">
      <article className="card">
        <h3>Categories</h3>
        <div className="actions">
          <button onClick={() => loadCategories().catch(() => undefined)}>Load</button>
          <button className="primary" onClick={() => createCategory().catch(() => undefined)}>
            Create
          </button>
          <button onClick={() => updateCategory().catch(() => undefined)}>Update</button>
          <button className="danger" onClick={() => deleteCategory().catch(() => undefined)}>
            Delete
          </button>
        </div>

        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </label>
        <label>
          Slug
          <input
            value={form.slug}
            onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
          />
        </label>
        <label>
          Description
          <input
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </label>
        <label>
          Parent ID
          <input
            value={form.parentId}
            onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
          />
        </label>
        <label>
          Sort Order
          <input
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
          />
        </label>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
          />
          Active
        </label>

        {message ? <p className="status-message">{message}</p> : null}
      </article>

      <article className="card">
        <h3>Category List</h3>
        <div className="list">
          {categories.map((category) => (
            <article key={category.id} className="list-item">
              <h4>{category.name}</h4>
              <p>
                {category.slug} - {category.isActive ? 'active' : 'inactive'}
              </p>
              <button onClick={() => selectCategory(category)}>Edit</button>
            </article>
          ))}
          {categories.length === 0 ? <p className="hint">No categories loaded.</p> : null}
        </div>
      </article>
    </section>
  );
}

function buildCategoryPayload(form: {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
}) {
  const payload: {
    name: string;
    slug?: string;
    description?: string;
    parentId?: string;
    sortOrder: number;
    isActive: boolean;
  } = {
    name: form.name.trim(),
    sortOrder: Number(form.sortOrder || '0'),
    isActive: form.isActive,
  };

  const slug = form.slug.trim();
  const description = form.description.trim();
  const parentId = form.parentId.trim();

  if (slug) {
    payload.slug = slug;
  }
  if (description) {
    payload.description = description;
  }
  if (parentId) {
    payload.parentId = parentId;
  }

  return payload;
}
