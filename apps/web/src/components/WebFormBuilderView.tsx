'use client';

import React, { useState, useEffect } from 'react';
import type { WebFormDto, WebFormFieldDto, WebFormFieldType } from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface WebFormBuilderViewProps {
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
}

export function WebFormBuilderView({ onNotify }: WebFormBuilderViewProps) {
  const [forms, setForms] = useState<WebFormDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewForm, setPreviewForm] = useState<WebFormDto | null>(null);

  // New Form Fields
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [submitBtnText, setSubmitBtnText] = useState('ارسال اطلاعات');
  const [successMsg, setSuccessMsg] = useState(
    'درخواست شما با موفقیت ثبت شد. کارشناسان ما به زودی با شما تماس خواهند گرفت.',
  );
  const [fields, setFields] = useState<WebFormFieldDto[]>([
    { id: 'f-1', name: 'displayName', label: 'نام و نام خانوادگی', type: 'TEXT', required: true },
    { id: 'f-2', name: 'phone', label: 'شماره تلفن همراه', type: 'PHONE', required: true },
    { id: 'f-3', name: 'email', label: 'آدرس ایمیل', type: 'EMAIL', required: false },
    { id: 'f-4', name: 'notes', label: 'شرح نیاز یا سوال شما', type: 'TEXTAREA', required: false },
  ]);

  // Preview form test input state
  const [testInputs, setTestInputs] = useState<Record<string, string>>({});
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  const loadForms = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getWebForms();
      setForms(res);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری فرم‌های وب', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleAddField = () => {
    const id = `f-${Date.now()}`;
    setFields((prev) => [
      ...prev,
      {
        id,
        name: `field_${prev.length + 1}`,
        label: `فیلد جدید ${prev.length + 1}`,
        type: 'TEXT',
        required: false,
      },
    ]);
  };

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleCreateForm = async () => {
    if (!formName.trim() || !formTitle.trim()) return;

    try {
      const created = await apiClient.createWebForm({
        name: formName.trim(),
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        submitButtonText: submitBtnText.trim() || 'ارسال اطلاعات',
        successMessage: successMsg.trim(),
        fields,
        leadSource: 'WEBSITE',
      });
      setForms((prev) => [created, ...prev]);
      onNotify?.(`فرم آنلاین «${created.name}» با موفقیت ایجاد گردید`, 'success');
      setIsModalOpen(false);
      setFormName('');
      setFormTitle('');
      setFormDesc('');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ایجاد فرم آنلاین', 'error');
    }
  };

  const handleTestSubmit = async () => {
    if (!previewForm) return;

    try {
      setIsSubmittingTest(true);
      const res = await apiClient.submitPublicWebForm(previewForm.id, {
        formId: previewForm.id,
        formData: testInputs,
        referrerUrl: 'https://preview.local/test-form',
      });
      onNotify?.(
        `${res.message} (سرنخ جدید با شماره شناسه ${res.leadId.slice(-6)} در CRM ایجاد شد)`,
        'success',
      );
      setTestInputs({});
      setPreviewForm(null);
      // Reload forms to see counter incremented
      loadForms();
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ارسال تست فرم', 'error');
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const getEmbedSnippet = (form: WebFormDto) => {
    return `<iframe src="https://crm.local/public/forms/${form.slug}" width="100%" height="450" frameborder="0"></iframe>`;
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs">
        در حال بارگذاری ماژول فرم‌ساز آنلاین...
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="web-form-builder-view">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-900/80 p-4 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl">📝</span>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              فرم‌ساز آنلاین و جذب مستقیم سرنخ (Didar Web Forms)
            </h3>
            <p className="text-[11px] text-slate-400">
              طراحی فرم‌های ورود لید جهت قرار دادن در وب‌سایت، وردپرس (Gravity Forms) و لندینگ‌پیج‌ها
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          data-testid="create-web-form-btn"
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow flex items-center gap-1"
        >
          <span>➕ ایجاد فرم وب جدید</span>
        </button>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forms.map((form) => (
          <div
            key={form.id}
            data-testid={`form-card-${form.id}`}
            className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-sm text-slate-100">{form.name}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{form.title}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                {form.submissionsCount} ثبت لید
              </span>
            </div>

            {/* Fields summary */}
            <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">فیلدهای فرم:</span>
              <div className="flex flex-wrap gap-1.5">
                {form.fields.map((f) => (
                  <span
                    key={f.id}
                    className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px] border border-slate-700"
                  >
                    {f.label} {f.required && <strong className="text-rose-400">*</strong>}
                  </span>
                ))}
              </div>
            </div>

            {/* Embed Snippet */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">
                کد امبد جهت قرار دادن در سایت وردپرس/HTML:
              </span>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto dir-ltr">
                {getEmbedSnippet(form)}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  setPreviewForm(form);
                  setTestInputs({});
                }}
                data-testid={`preview-form-${form.id}`}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                👁️ تست و پیش‌نمایش فرم
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Live Form Preview & Test Submission */}
      {previewForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100">{previewForm.title}</h4>
                {previewForm.description && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{previewForm.description}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewForm(null)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {previewForm.fields.map((f) => (
                <div key={f.id} className="space-y-1 text-xs">
                  <label className="text-slate-300 block">
                    {f.label} {f.required && <strong className="text-rose-400">*</strong>}
                  </label>
                  {f.type === 'TEXTAREA' ? (
                    <textarea
                      rows={3}
                      value={testInputs[f.name] || ''}
                      onChange={(e) =>
                        setTestInputs({ ...testInputs, [f.name]: e.target.value })
                      }
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs"
                    />
                  ) : (
                    <input
                      type={f.type === 'EMAIL' ? 'email' : f.type === 'PHONE' ? 'tel' : 'text'}
                      value={testInputs[f.name] || ''}
                      onChange={(e) =>
                        setTestInputs({ ...testInputs, [f.name]: e.target.value })
                      }
                      placeholder={f.placeholder || ''}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setPreviewForm(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
              >
                بستن
              </button>
              <button
                onClick={handleTestSubmit}
                disabled={isSubmittingTest}
                data-testid="submit-test-form-btn"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-bold"
              >
                {previewForm.submitButtonText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Web Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-sm font-bold text-slate-100">
              <span>📝</span>
              <h4>طراحی فرم جدید ورود سرنخ و لید</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">نام داخلی فرم:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: فرم درخواست مشاوره تخصصی"
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">عنوان عمومی فرم (نمایش در سایت):</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: فرم رایگان مشاوره خرید"
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">پیام موفقیت پس از ثبت:</label>
                <input
                  type="text"
                  value={successMsg}
                  onChange={(e) => setSuccessMsg(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
                />
              </div>

              {/* Fields Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-300">فیلدهای فرم:</label>
                  <button
                    onClick={handleAddField}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    ➕ افزودن فیلد جدید
                  </button>
                </div>

                {fields.map((f, idx) => (
                  <div
                    key={f.id}
                    className="p-2.5 bg-slate-800/60 border border-slate-700 rounded-lg flex items-center justify-between gap-2"
                  >
                    <span className="font-semibold text-slate-200">{f.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded">
                        {f.type}
                      </span>
                      <label className="flex items-center gap-1 text-[11px] text-slate-400">
                        <input
                          type="checkbox"
                          checked={f.required}
                          onChange={(e) => {
                            const next = [...fields];
                            next[idx] = { ...next[idx]!, required: e.target.checked };
                            setFields(next);
                          }}
                        />
                        الزامی
                      </label>
                      <button
                        onClick={() => handleRemoveField(f.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                انصراف
              </button>
              <button
                onClick={handleCreateForm}
                disabled={!formName.trim() || !formTitle.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow"
              >
                ذخیره و ایجاد فرم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebFormBuilderView;
