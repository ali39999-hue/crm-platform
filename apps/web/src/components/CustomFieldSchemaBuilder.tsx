'use client';

import React, { useState, useEffect } from 'react';
import type {
  CreateCustomFieldRequest,
  CustomFieldDefinitionDto,
  CustomFieldEntityType,
  CustomFieldType,
} from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface CustomFieldSchemaBuilderProps {
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
}

export function CustomFieldSchemaBuilder({ onNotify }: CustomFieldSchemaBuilderProps) {
  const [fields, setFields] = useState<CustomFieldDefinitionDto[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<CustomFieldEntityType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entityType, setEntityType] = useState<CustomFieldEntityType>('ACCOUNT');
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<CustomFieldType>('TEXT');
  const [optionsStr, setOptionsStr] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadFields = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getCustomFields(
        selectedEntityType === 'ALL' ? undefined : selectedEntityType,
      );
      setFields(res);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری فیلدهای سفارشی', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, [selectedEntityType]);

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !label.trim()) return;

    try {
      setSubmitting(true);
      const options =
        type === 'SELECT'
          ? optionsStr
              .split(/[,،]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;

      const req: CreateCustomFieldRequest = {
        entityType,
        key: key.trim(),
        label: label.trim(),
        type,
        options,
        isRequired,
      };

      const created = await apiClient.createCustomField(req);
      setFields((prev) => [...prev, created]);
      setIsModalOpen(false);
      setKey('');
      setLabel('');
      setOptionsStr('');
      setIsRequired(false);
      onNotify?.(`فیلد سفارشی «${created.label}» با موفقیت افزوده شد`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ایجاد فیلد سفارشی', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (field: CustomFieldDefinitionDto) => {
    try {
      const nextActive = !field.active;
      const updated = await apiClient.updateCustomField(field.id, { active: nextActive });
      setFields((prev) => prev.map((f) => (f.id === field.id ? updated : f)));
      onNotify?.(
        `فیلد «${field.label}» ${nextActive ? 'فعال شد' : 'بایگانی گردید'}`,
        'success',
      );
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در تغییر وضعیت فیلد', 'error');
    }
  };

  const handleDeleteField = async (field: CustomFieldDefinitionDto) => {
    if (
      !window.confirm(
        `آیا از حذف دائم فیلد سفارشی «${field.label}» اطمینان دارید؟ داده‌های ثبت‌شده در این فیلد دیگر قابل دسترسی نخواهند بود.`,
      )
    ) {
      return;
    }

    try {
      await apiClient.deleteCustomField(field.id);
      setFields((prev) => prev.filter((f) => f.id !== field.id));
      onNotify?.(`فیلد «${field.label}» با موفقیت حذف شد`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در حذف فیلد سفارشی', 'error');
    }
  };

  const ENTITIES: Array<{ id: CustomFieldEntityType | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'همه موجودیت‌ها' },
    { id: 'ACCOUNT', label: 'حساب‌ها و شرکت‌ها' },
    { id: 'CONTACT', label: 'مخاطبان' },
    { id: 'LEAD', label: 'سرنخ‌ها' },
    { id: 'DEAL', label: 'معاملات و فرصت‌ها' },
    { id: 'TASK', label: 'وظایف' },
    { id: 'TICKET', label: 'تیکت‌های پشتیبانی' },
  ];

  const getTypeBadge = (fieldType: CustomFieldType) => {
    switch (fieldType) {
      case 'TEXT':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800">متن (Text)</span>;
      case 'NUMBER':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">عددی (Number)</span>;
      case 'BOOLEAN':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800">بولیین (Boolean)</span>;
      case 'SELECT':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800">انتخابی (Select)</span>;
      case 'DATE':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">تاریخ (Date)</span>;
      default:
        return fieldType;
    }
  };

  return (
    <div className="space-y-4" data-testid="custom-field-schema-builder">
      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>🛠️</span>
            <span>مدیریت اسکیمای فیلدهای سفارشی (Custom Fields Schema Builder)</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            تعریف فیلدهای داینامیک، تعیین نوع داده، اعتبارسنجی سمت سرور و ترتیب نمایش در فرم‌های عملیاتی
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          data-testid="create-field-btn"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow"
        >
          <span>+</span>
          <span>تعریف فیلد سفارشی جدید</span>
        </button>
      </div>

      {/* Entity Type Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        {ENTITIES.map((ent) => (
          <button
            key={ent.id}
            type="button"
            onClick={() => setSelectedEntityType(ent.id)}
            data-testid={`entity-tab-${ent.id}`}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
              selectedEntityType === ent.id
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {ent.label}
          </button>
        ))}
      </div>

      {/* Fields Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            در حال بارگذاری فیلدهای سفارشی...
          </div>
        ) : fields.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            هیچ فیلد سفارشی برای این موجودیت تعریف نشده است.
          </div>
        ) : (
          <table className="w-full text-right text-xs divide-y divide-slate-800">
            <thead className="bg-slate-800/70 text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3">عنوان فیلد</th>
                <th className="px-4 py-3">کلید سیستمی (Key)</th>
                <th className="px-4 py-3">موجودیت مقصد</th>
                <th className="px-4 py-3">نوع داده</th>
                <th className="px-4 py-3">گزینه‌ها / مقادیر مجاز</th>
                <th className="px-4 py-3">الزام</th>
                <th className="px-4 py-3">وضعیت</th>
                <th className="px-4 py-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60" data-testid="custom-fields-tbody">
              {fields.map((field) => (
                <tr
                  key={field.id}
                  data-testid={`field-row-${field.id}`}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-200">{field.label}</td>
                  <td className="px-4 py-3 font-mono text-indigo-400 text-[11px]">{field.key}</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                    {field.entityType}
                  </td>
                  <td className="px-4 py-3">{getTypeBadge(field.type)}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {field.options && field.options.length > 0 ? (
                      <span className="truncate block max-w-xs text-[11px]">
                        {field.options.join(' • ')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {field.isRequired ? (
                      <span className="text-rose-400 font-bold">اجباری</span>
                    ) : (
                      <span className="text-slate-500">اختیاری</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        field.active
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {field.active ? 'فعال' : 'بایگانی‌شده'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(field)}
                        data-testid={`toggle-active-btn-${field.id}`}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                      >
                        {field.active ? 'بایگانی' : 'فعال‌سازی'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field)}
                        data-testid={`delete-field-btn-${field.id}`}
                        className="px-2 py-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-[11px]"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Field Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="create-field-modal"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base">تعریف فیلد سفارشی جدید</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateField} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  موجودیت مقصد (Target Entity) *
                </label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value as CustomFieldEntityType)}
                  data-testid="field-entity-select"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ACCOUNT">حساب‌ها و شرکت‌ها (Account)</option>
                  <option value="CONTACT">مخاطبان (Contact)</option>
                  <option value="LEAD">سرنخ‌ها (Lead)</option>
                  <option value="DEAL">معاملات و فرصت‌ها (Deal)</option>
                  <option value="TASK">وظایف و کارها (Task)</option>
                  <option value="TICKET">تیکت‌های پشتیبانی (Ticket)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">عنوان نمایشی فیلد *</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="مثال: شناسه مالیاتی / شماره پروانه"
                  data-testid="field-label-input"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  کلید سیستمی (انگلیسی، بدون فاصله) *
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="مثال: tax_identification_number"
                  data-testid="field-key-input"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm font-mono focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">نوع داده (Data Type) *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CustomFieldType)}
                  data-testid="field-type-select"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="TEXT">متن معمولی (TEXT)</option>
                  <option value="NUMBER">عددی (NUMBER)</option>
                  <option value="BOOLEAN">بولیین بله/خیر (BOOLEAN)</option>
                  <option value="SELECT">انتخابی چندگزینه‌ای (SELECT)</option>
                  <option value="DATE">تاریخ (DATE)</option>
                </select>
              </div>

              {type === 'SELECT' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    گزینه‌های انتخابی (با کاما یا ویرگول جدا کنید) *
                  </label>
                  <input
                    type="text"
                    value={optionsStr}
                    onChange={(e) => setOptionsStr(e.target.value)}
                    placeholder="گزینه اول، گزینه دوم، گزینه سوم"
                    data-testid="field-options-input"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isRequiredFieldCheck"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  data-testid="field-required-checkbox"
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                />
                <label htmlFor="isRequiredFieldCheck" className="text-xs text-slate-300 cursor-pointer">
                  تکمیل این فیلد در فرم‌های مربوطه الزامی باشد (Required Field)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="submit-field-btn"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow"
                >
                  {submitting ? 'در حال ثبت...' : 'ایجاد فیلد سفارشی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomFieldSchemaBuilder;
