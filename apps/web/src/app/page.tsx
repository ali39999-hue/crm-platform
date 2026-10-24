const summary = [
  { label: 'کارهای من', value: '—', note: 'پس از اتصال API نمایش داده می‌شود' },
  { label: 'سرنخ‌های بدون پیگیری', value: '—', note: 'KPI هنوز به داده واقعی وصل نیست' },
  { label: 'درخواست‌های باز', value: '—', note: 'برای جلوگیری از عدد ساختگی' },
  { label: 'وظایف سررسیدگذشته', value: '—', note: 'تعریف timezone و تقویم کاری لازم است' },
];

const areas = [
  ['کارهای من', 'وظایف، اولویت‌ها، مهلت‌ها و کارهای نیازمند اقدام'],
  ['مشتریان', 'شرکت‌ها، مخاطبان، فرصت‌های فروش و تاریخچه تعامل'],
  ['پروژه‌ها', 'برد، فهرست، وابستگی، مالک و پیشرفت'],
  ['پشتیبانی', 'درخواست‌ها، پاسخ‌های داخلی/مشتری و SLA'],
];

export default function HomePage() {
  return (
    <main className="shell">
      <aside className="sidebar" aria-label="ناوبری اصلی">
        <div className="brand"><span className="brand-mark">C</span><span>Workspace CRM</span></div>
        <div className="workspace-label">فضای کاری</div>
        <div className="workspace-switch">شرکت شما <span aria-hidden="true">⌄</span></div>
        <nav className="nav-list">
          <a className="nav-link active" href="#overview">نمای کلی</a>
          <a className="nav-link" href="#my-work">کارهای من</a>
          <a className="nav-link" href="#customers">مشتریان</a>
          <a className="nav-link" href="#projects">پروژه‌ها</a>
          <a className="nav-link" href="#support">پشتیبانی</a>
          <a className="nav-link" href="#reports">گزارش‌ها</a>
          <a className="nav-link" href="#settings">تنظیمات</a>
        </nav>
        <div className="sidebar-foot">اسکلت UX — داده و دسترسی واقعی هنوز وصل نشده‌اند.</div>
      </aside>

      <section className="main-area" id="overview">
        <header className="topbar">
          <div>
            <p className="eyebrow">محیط کاری سازمان</p>
            <h1>سلام، خوش آمدید</h1>
            <p className="muted">این صفحه نمونه طراحی است؛ عددها عمداً از API خوانده نمی‌شوند.</p>
          </div>
          <div className="top-actions"><button className="secondary-button" type="button">جست‌وجو</button><button className="primary-button" type="button">+ ایجاد مورد</button></div>
        </header>

        <section className="summary-grid" aria-label="شاخص‌های خلاصه">
          {summary.map((item) => (
            <article className="summary-card" key={item.label}>
              <p>{item.label}</p><strong>{item.value}</strong><small>{item.note}</small>
            </article>
          ))}
        </section>

        <section className="section-block" id="my-work">
          <div className="section-heading"><div><h2>فضاهای کاری</h2><p className="muted">ساختار اولیه ناوبری؛ هر بخش باید با فازهای رودمپ تکمیل شود.</p></div></div>
          <div className="area-grid">
            {areas.map(([name, desc], index) => (
              <article className="area-card" key={name} id={['my-work-card', 'customers', 'projects', 'support'][index]}>
                <span className="area-icon" aria-hidden="true">{['✓', '◎', '▦', '↗'][index]}</span>
                <h3>{name}</h3><p>{desc}</p><span className="area-link">در نقشه توسعه <span aria-hidden="true">←</span></span>
              </article>
            ))}
          </div>
        </section>

        <section className="notice" id="reports">
          <strong>وضعیت قالب</strong>
          <p>این UI برای شروع بحث طراحی است. پیش از استفاده روزمره باید احراز هویت، مجوزها، داده واقعی، loading/empty/error state، دسترس‌پذیری، RTL و تست‌های E2E پیاده‌سازی شوند.</p>
        </section>
      </section>
    </main>
  );
}
