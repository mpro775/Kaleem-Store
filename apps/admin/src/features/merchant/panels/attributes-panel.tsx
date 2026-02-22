import { useEffect, useState } from 'react';
import type { MerchantRequester } from '../merchant-dashboard';
import type { Attribute, AttributeValue, Category, CategoryAttributes } from '../types';

interface AttributesPanelProps {
  request: MerchantRequester;
}

const attributeFormDefault = {
  name: '',
  slug: '',
};

const valueFormDefault = {
  value: '',
  slug: '',
};

export function AttributesPanel({ request }: AttributesPanelProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAttributeId, setSelectedAttributeId] = useState('');
  const [selectedValueId, setSelectedValueId] = useState('');
  const [attributeForm, setAttributeForm] = useState(attributeFormDefault);
  const [valueForm, setValueForm] = useState(valueFormDefault);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategoryAttributeIds, setSelectedCategoryAttributeIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadBaseData().catch(() => undefined);
  }, []);

  async function loadBaseData(): Promise<void> {
    setMessage('');
    try {
      const [attributesData, categoriesData] = await Promise.all([
        request<Attribute[]>('/attributes?includeValues=true', { method: 'GET' }),
        request<Category[]>('/categories', { method: 'GET' }),
      ]);

      setAttributes(attributesData ?? []);
      setCategories(categoriesData ?? []);
      setMessage('Attributes and categories loaded');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load attributes');
    }
  }

  async function createAttribute(): Promise<void> {
    setMessage('');
    try {
      await request('/attributes', {
        method: 'POST',
        body: JSON.stringify(buildAttributePayload(attributeForm)),
      });
      setAttributeForm(attributeFormDefault);
      await loadBaseData();
      setMessage('Attribute created');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create attribute');
    }
  }

  async function updateAttribute(): Promise<void> {
    if (!selectedAttributeId) {
      setMessage('Select an attribute first');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/${selectedAttributeId}`, {
        method: 'PUT',
        body: JSON.stringify(buildAttributePayload(attributeForm)),
      });
      await loadBaseData();
      setMessage('Attribute updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update attribute');
    }
  }

  async function deleteAttribute(): Promise<void> {
    if (!selectedAttributeId) {
      setMessage('Select an attribute first');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/${selectedAttributeId}`, {
        method: 'DELETE',
      });
      setSelectedAttributeId('');
      setSelectedValueId('');
      setAttributeForm(attributeFormDefault);
      setValueForm(valueFormDefault);
      await loadBaseData();
      setMessage('Attribute deleted');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete attribute');
    }
  }

  async function createValue(): Promise<void> {
    if (!selectedAttributeId) {
      setMessage('Select an attribute first');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/${selectedAttributeId}/values`, {
        method: 'POST',
        body: JSON.stringify(buildValuePayload(valueForm)),
      });
      setValueForm(valueFormDefault);
      setSelectedValueId('');
      await loadBaseData();
      setMessage('Attribute value created');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create value');
    }
  }

  async function updateValue(): Promise<void> {
    if (!selectedAttributeId || !selectedValueId) {
      setMessage('Select a value first');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/${selectedAttributeId}/values/${selectedValueId}`, {
        method: 'PUT',
        body: JSON.stringify(buildValuePayload(valueForm)),
      });
      await loadBaseData();
      setMessage('Attribute value updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update value');
    }
  }

  async function deleteValue(): Promise<void> {
    if (!selectedAttributeId || !selectedValueId) {
      setMessage('Select a value first');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/${selectedAttributeId}/values/${selectedValueId}`, {
        method: 'DELETE',
      });
      setValueForm(valueFormDefault);
      setSelectedValueId('');
      await loadBaseData();
      setMessage('Attribute value deleted');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete value');
    }
  }

  async function loadCategoryAttributes(categoryId: string): Promise<void> {
    setMessage('');
    setSelectedCategoryId(categoryId);

    if (!categoryId) {
      setSelectedCategoryAttributeIds([]);
      return;
    }

    try {
      const data = await request<CategoryAttributes>(
        `/attributes/categories/${categoryId}/attributes`,
        { method: 'GET' },
      );
      setSelectedCategoryAttributeIds(data?.attributeIds ?? []);
      setMessage('Category attribute assignments loaded');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load category attributes');
    }
  }

  async function saveCategoryAttributes(): Promise<void> {
    if (!selectedCategoryId) {
      setMessage('Choose a category first');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/categories/${selectedCategoryId}/attributes`, {
        method: 'PUT',
        body: JSON.stringify({ attributeIds: selectedCategoryAttributeIds }),
      });
      setMessage('Category attributes updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update category attributes');
    }
  }

  function selectAttribute(attribute: Attribute): void {
    setSelectedAttributeId(attribute.id);
    setSelectedValueId('');
    setValueForm(valueFormDefault);
    setAttributeForm({
      name: attribute.name,
      slug: attribute.slug,
    });
  }

  function selectValue(value: AttributeValue): void {
    setSelectedValueId(value.id);
    setValueForm({
      value: value.value,
      slug: value.slug,
    });
  }

  function toggleCategoryAttribute(attributeId: string, enabled: boolean): void {
    setSelectedCategoryAttributeIds((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(attributeId);
      } else {
        next.delete(attributeId);
      }
      return [...next];
    });
  }

  const selectedAttribute =
    attributes.find((attribute) => attribute.id === selectedAttributeId) ?? null;

  return (
    <section className="card-grid">
      <article className="card">
        <h3>Attributes</h3>
        <div className="actions">
          <button onClick={() => loadBaseData().catch(() => undefined)}>Reload</button>
          <button className="primary" onClick={() => createAttribute().catch(() => undefined)}>
            Create
          </button>
          <button onClick={() => updateAttribute().catch(() => undefined)}>Update</button>
          <button className="danger" onClick={() => deleteAttribute().catch(() => undefined)}>
            Delete
          </button>
        </div>

        <label>
          Name
          <input
            value={attributeForm.name}
            onChange={(event) =>
              setAttributeForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </label>

        <label>
          Slug
          <input
            value={attributeForm.slug}
            onChange={(event) =>
              setAttributeForm((prev) => ({ ...prev, slug: event.target.value }))
            }
          />
        </label>

        <div className="list compact-list">
          {attributes.map((attribute) => (
            <article key={attribute.id} className="list-item">
              <p>
                <strong>{attribute.name}</strong> ({attribute.slug})
              </p>
              <p>{attribute.values?.length ?? 0} values</p>
              <button onClick={() => selectAttribute(attribute)}>Select</button>
            </article>
          ))}
          {attributes.length === 0 ? <p className="hint">No attributes loaded.</p> : null}
        </div>
      </article>

      <article className="card">
        <h3>Attribute Values</h3>
        {selectedAttribute ? (
          <p>
            Selected attribute: <strong>{selectedAttribute.name}</strong>
          </p>
        ) : (
          <p className="hint">Select an attribute to manage values.</p>
        )}

        <div className="actions">
          <button className="primary" onClick={() => createValue().catch(() => undefined)}>
            Create Value
          </button>
          <button onClick={() => updateValue().catch(() => undefined)}>Update Value</button>
          <button className="danger" onClick={() => deleteValue().catch(() => undefined)}>
            Delete Value
          </button>
        </div>

        <label>
          Value
          <input
            value={valueForm.value}
            onChange={(event) => setValueForm((prev) => ({ ...prev, value: event.target.value }))}
          />
        </label>

        <label>
          Slug
          <input
            value={valueForm.slug}
            onChange={(event) => setValueForm((prev) => ({ ...prev, slug: event.target.value }))}
          />
        </label>

        <div className="list compact-list">
          {(selectedAttribute?.values ?? []).map((value) => (
            <article key={value.id} className="list-item">
              <p>
                <strong>{value.value}</strong> ({value.slug})
              </p>
              <button onClick={() => selectValue(value)}>Select</button>
            </article>
          ))}
          {(selectedAttribute?.values ?? []).length === 0 ? (
            <p className="hint">No values for selected attribute.</p>
          ) : null}
        </div>
      </article>

      <article className="card">
        <h3>Category Attribute Mapping</h3>
        <label>
          Category
          <select
            value={selectedCategoryId}
            onChange={(event) => loadCategoryAttributes(event.target.value).catch(() => undefined)}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <div className="inline-check-grid">
          {attributes.map((attribute) => (
            <label key={attribute.id} className="inline-check">
              <input
                type="checkbox"
                checked={selectedCategoryAttributeIds.includes(attribute.id)}
                onChange={(event) => toggleCategoryAttribute(attribute.id, event.target.checked)}
              />
              {attribute.name}
            </label>
          ))}
        </div>

        <button className="primary" onClick={() => saveCategoryAttributes().catch(() => undefined)}>
          Save Category Mapping
        </button>
      </article>

      {message ? <p className="status-message">{message}</p> : null}
    </section>
  );
}

function buildAttributePayload(form: typeof attributeFormDefault) {
  const payload: { name: string; slug?: string } = {
    name: form.name.trim(),
  };

  const slug = form.slug.trim();
  if (slug) {
    payload.slug = slug;
  }

  return payload;
}

function buildValuePayload(form: typeof valueFormDefault) {
  const payload: { value: string; slug?: string } = {
    value: form.value.trim(),
  };

  const slug = form.slug.trim();
  if (slug) {
    payload.slug = slug;
  }

  return payload;
}
