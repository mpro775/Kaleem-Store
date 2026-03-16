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
      setMessage('تم تحميل الخصائص والتصنيفات');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل الخصائص');
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
      setMessage('تم إنشاء الخاصية');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء الخاصية');
    }
  }

  async function updateAttribute(): Promise<void> {
    if (!selectedAttributeId) {
      setMessage('اختر خاصية أولاً');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/${selectedAttributeId}`, {
        method: 'PUT',
        body: JSON.stringify(buildAttributePayload(attributeForm)),
      });
      await loadBaseData();
      setMessage('تم تحديث الخاصية');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث الخاصية');
    }
  }

  async function deleteAttribute(): Promise<void> {
    if (!selectedAttributeId) {
      setMessage('اختر خاصية أولاً');
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
      setMessage('تم حذف الخاصية');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حذف الخاصية');
    }
  }

  async function createValue(): Promise<void> {
    if (!selectedAttributeId) {
      setMessage('اختر خاصية أولاً');
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
      setMessage('تم إنشاء قيمة الخاصية');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء القيمة');
    }
  }

  async function updateValue(): Promise<void> {
    if (!selectedAttributeId || !selectedValueId) {
      setMessage('اختر قيمة أولاً');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/${selectedAttributeId}/values/${selectedValueId}`, {
        method: 'PUT',
        body: JSON.stringify(buildValuePayload(valueForm)),
      });
      await loadBaseData();
      setMessage('تم تحديث قيمة الخاصية');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث القيمة');
    }
  }

  async function deleteValue(): Promise<void> {
    if (!selectedAttributeId || !selectedValueId) {
      setMessage('اختر قيمة أولاً');
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
      setMessage('تم حذف قيمة الخاصية');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حذف القيمة');
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
      setMessage('تم تحميل ربط الخصائص بالتصنيف');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل خصائص التصنيف');
    }
  }

  async function saveCategoryAttributes(): Promise<void> {
    if (!selectedCategoryId) {
      setMessage('اختر تصنيفاً أولاً');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/categories/${selectedCategoryId}/attributes`, {
        method: 'PUT',
        body: JSON.stringify({ attributeIds: selectedCategoryAttributeIds }),
      });
      setMessage('تم تحديث خصائص التصنيف');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث خصائص التصنيف');
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
        <h3>الخصائص</h3>
        <div className="actions">
          <button onClick={() => loadBaseData().catch(() => undefined)}>إعادة تحميل</button>
          <button className="primary" onClick={() => createAttribute().catch(() => undefined)}>
            إنشاء
          </button>
          <button onClick={() => updateAttribute().catch(() => undefined)}>تحديث</button>
          <button className="danger" onClick={() => deleteAttribute().catch(() => undefined)}>
            حذف
          </button>
        </div>

        <label>
          الاسم
          <input
            value={attributeForm.name}
            onChange={(event) =>
              setAttributeForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </label>

        <label>
          المسار المختصر
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
              <p>{attribute.values?.length ?? 0} قيمة</p>
              <button onClick={() => selectAttribute(attribute)}>اختيار</button>
            </article>
          ))}
          {attributes.length === 0 ? <p className="hint">لا توجد خصائص محملة.</p> : null}
        </div>
      </article>

      <article className="card">
        <h3>قيم الخصائص</h3>
        {selectedAttribute ? (
          <p>
            الخاصية المحددة: <strong>{selectedAttribute.name}</strong>
          </p>
        ) : (
          <p className="hint">اختر خاصية لإدارة القيم.</p>
        )}

        <div className="actions">
          <button className="primary" onClick={() => createValue().catch(() => undefined)}>
            إنشاء قيمة
          </button>
          <button onClick={() => updateValue().catch(() => undefined)}>تحديث القيمة</button>
          <button className="danger" onClick={() => deleteValue().catch(() => undefined)}>
            حذف القيمة
          </button>
        </div>

        <label>
          القيمة
          <input
            value={valueForm.value}
            onChange={(event) => setValueForm((prev) => ({ ...prev, value: event.target.value }))}
          />
        </label>

        <label>
          المسار المختصر
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
              <button onClick={() => selectValue(value)}>اختيار</button>
            </article>
          ))}
          {(selectedAttribute?.values ?? []).length === 0 ? (
            <p className="hint">لا توجد قيم للخاصية المحددة.</p>
          ) : null}
        </div>
      </article>

      <article className="card">
        <h3>ربط الخصائص بالتصنيف</h3>
        <label>
          التصنيف
          <select
            value={selectedCategoryId}
            onChange={(event) => loadCategoryAttributes(event.target.value).catch(() => undefined)}
          >
            <option value="">اختر تصنيفاً</option>
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
          حفظ الربط
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
