import { useState, useEffect, useRef } from 'react'
import {
  NovaLogo,
  NovaBeaconOrbit,
} from '../components/NovaLogo'
import {
  Search,
  Calculator,
  Cpu,
  ArrowRight,
  Sun,
  Moon,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  HelpCircle,
  FileCheck,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react'

interface PresetConfig {
  id: string
  title: string
  role: string
  badge: string
  priceFrom: string
  setupPrice: string
  productId: string
  description: string
  tags: string[]
}

const PRESETS: PresetConfig[] = [
  {
    id: 'preset-smm',
    title: 'SMM & Контент-отдел',
    role: 'AI-SMM-ассистент и контент-мейкер',
    badge: 'Маркетинг',
    priceFrom: 'от 15 000 ₽',
    setupPrice: 'Запуск 15 000 ₽ · 9 900 ₽/мес',
    productId: 'prod-single',
    description: 'Генерация постов, рубрикатора, отложенный постинг в Telegram и ВКонтакте, аналитика охватов.',
    tags: ['Telegram Канал', 'ВКонтакте', 'Контент-план', 'Модерация'],
  },
  {
    id: 'preset-rag',
    title: 'Корпоративный методист (RAG)',
    role: 'Корпоративный RAG-помощник по регламентам и HR',
    badge: 'База знаний',
    priceFrom: 'от 35 000 ₽',
    setupPrice: 'Запуск 35 000 ₽ · 18 900 ₽/мес',
    productId: 'prod-bundle',
    description: 'Точные ответы сотрудникам по PDF-регламентам, должностным инструкциям и базе знаний компании.',
    tags: ['RAG-поиск', 'Telegram Бот', 'Семантическая память', 'RBAC'],
  },
  {
    id: 'preset-crm',
    title: 'Клиентский сервис 24/7 + CRM',
    role: 'Поддержка клиентов и оператор первой линии 24/7',
    badge: 'Продажи & Сервис',
    priceFrom: 'от 35 000 ₽',
    setupPrice: 'Запуск 49 000 ₽ · 22 400 ₽/мес',
    productId: 'prod-bundle',
    description: 'Квалификация лидов, фиксация диалогов в amoCRM/Bitrix24, ответы в WhatsApp Business без задержек.',
    tags: ['WhatsApp Business', 'amoCRM / Bitrix24', 'Маршрутизация'],
  },
]

const FAQS = [
  {
    q: 'Как формируется итоговая стоимость запуска и подписки?',
    a: 'Стоимость состоит из трёх прозрачных частей: разовый запуск (настройка контура, коннекторов и промптов), ежемесячная поддержка (хостинг, сопровождение коннекторов, рабочие места) и расход на AI-токены по себестоимости провайдеров.',
  },
  {
    q: 'Как обеспечивается безопасность коммерческих данных компании?',
    a: 'Каждый агент разворачивается в изолированной виртуальной машине (Proxmox/KVM). Данные вашей базы знаний шифруются и не используются для дообучения публичных базовых моделей.',
  },
  {
    q: 'Сколько времени занимает внедрение готового решения?',
    a: 'Типовое внедрение одного агента занимает от 5 до 7 рабочих дней. Комплексные решения со сложными CRM и кастомными шлюзами — от 10 до 14 рабочих дней.',
  },
  {
    q: 'Как оплачиваются токены языковых моделей (LLM)?',
    a: 'Вы можете использовать собственный корпоративный API-ключ (OpenAI, Anthropic и др.) с комиссией 0%, либо единый баланс Nova с формированием ежемесячных закрывающих документов по фактическому потреблению.',
  },
  {
    q: 'Что происходит, если требуется нестандартная интеграция с 1С или самописной СУБД?',
    a: 'В конструкторе выберите опцию «Индивидуальное решение» или «Индивидуальная CRM / 1С». Наш технический архитектор проведет бесплатный аудит API и подготовит персональную смету разработки.',
  },
]

interface LandingPageProps {
  onStartBuilder: (productId?: string) => void
}

export function LandingPage({ onStartBuilder }: LandingPageProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('nova_theme') as 'dark' | 'light') || 'dark'
  })
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const scrollLockTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('nova_theme', theme)
  }, [theme])

  // Закрывать мобильное меню при изменении размера экрана на десктоп
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 960) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return
      const activeBtn = navRef.current.querySelector<HTMLButtonElement>(`button[data-section="${activeSection}"]`)
      if (activeBtn) {
        setIndicatorStyle({
          left: activeBtn.offsetLeft,
          width: activeBtn.offsetWidth,
          opacity: 1,
        })
      }
    }
    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [activeSection])

  useEffect(() => {
    const sectionIds = ['hero', 'products', 'presets', 'pricing-model', 'faq']
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
      if (scrollLockTimeoutRef.current) return

      const scrollPos = window.scrollY + 180
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i])
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sectionIds[i])
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    setActiveSection(id)
    setMobileMenuOpen(false)
    if (scrollLockTimeoutRef.current) {
      clearTimeout(scrollLockTimeoutRef.current)
    }
    scrollLockTimeoutRef.current = setTimeout(() => {
      scrollLockTimeoutRef.current = null
    }, 1000)

    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className={`landing-cinematic ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      {/* ХЕДЕР САЙТА — ФИКСИРОВАННЫЙ С ПРОЗРАЧНОСТЬЮ И БЛЮРОМ ПРИ СКРОЛЛЕ */}
      <header className={`cinematic-header ${isScrolled ? 'is-scrolled' : ''}`}>
        <div
          className="header-brand"
          role="button"
          tabIndex={0}
          onClick={() => {
            setMobileMenuOpen(false)
            window.location.href = '/'
          }}
          title="Перейти на главную"
          style={{ cursor: 'pointer' }}
        >
          <NovaLogo size={30} monochromeAi isStatic />
        </div>

        <nav className="header-nav" ref={navRef}>
          <button
            type="button"
            data-section="hero"
            className={activeSection === 'hero' ? 'active' : ''}
            onClick={e => scrollTo('hero', e)}
          >
            Главная
          </button>
          <button
            type="button"
            data-section="products"
            className={activeSection === 'products' ? 'active' : ''}
            onClick={e => scrollTo('products', e)}
          >
            Форматы
          </button>
          <button
            type="button"
            data-section="presets"
            className={activeSection === 'presets' ? 'active' : ''}
            onClick={e => scrollTo('presets', e)}
          >
            Готовые конфигурации
          </button>
          <button
            type="button"
            data-section="pricing-model"
            className={activeSection === 'pricing-model' ? 'active' : ''}
            onClick={e => scrollTo('pricing-model', e)}
          >
            Модель оплаты
          </button>
          <button
            type="button"
            data-section="faq"
            className={activeSection === 'faq' ? 'active' : ''}
            onClick={e => scrollTo('faq', e)}
          >
            FAQ
          </button>
          <span
            className="header-nav-slider"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
            }}
          />
        </nav>

        <div className="header-actions">
          <div className="lang-switcher" title="Выбор языка">
            <span>RU</span>
            <ChevronDown size={14} />
          </div>

          <button
            className="theme-toggle-btn desktop-only-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="btn-telegram-outline desktop-only-btn"
          >
            <span>Написать в Telegram</span>
            <ExternalLink size={14} />
          </a>

          {/* Кнопка бургер-меню для мобильной адаптации (как на фото) */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X size={24} color="var(--text-primary)" />
            ) : (
              <Menu size={24} color="var(--text-primary)" strokeWidth={2.2} />
            )}
          </button>
        </div>
      </header>

      {/* МОБИЛЬНОЕ ВЫПАДАЮЩЕЕ МЕНЮ С ПУНКТАМИ ТОПБАРА */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="mobile-nav-drawer"
            onClick={e => e.stopPropagation()}
          >
            <div className="mobile-nav-links">
              <button
                type="button"
                className={`mobile-nav-link ${activeSection === 'hero' ? 'active' : ''}`}
                onClick={e => scrollTo('hero', e)}
              >
                <span>Главная</span>
                {activeSection === 'hero' && <span className="mobile-active-dot" />}
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${activeSection === 'products' ? 'active' : ''}`}
                onClick={e => scrollTo('products', e)}
              >
                <span>Форматы</span>
                {activeSection === 'products' && <span className="mobile-active-dot" />}
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${activeSection === 'presets' ? 'active' : ''}`}
                onClick={e => scrollTo('presets', e)}
              >
                <span>Готовые конфигурации</span>
                {activeSection === 'presets' && <span className="mobile-active-dot" />}
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${activeSection === 'pricing-model' ? 'active' : ''}`}
                onClick={e => scrollTo('pricing-model', e)}
              >
                <span>Модель оплаты</span>
                {activeSection === 'pricing-model' && <span className="mobile-active-dot" />}
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${activeSection === 'faq' ? 'active' : ''}`}
                onClick={e => scrollTo('faq', e)}
              >
                <span>FAQ</span>
                {activeSection === 'faq' && <span className="mobile-active-dot" />}
              </button>
            </div>

            <div className="mobile-nav-divider" />

            <div className="mobile-nav-actions">
              <button
                type="button"
                className="btn-mobile-builder"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onStartBuilder()
                }}
              >
                <Calculator size={16} />
                <span>Открыть конструктор</span>
              </button>

              <div className="mobile-nav-aux-row">
                <button
                  type="button"
                  className="mobile-aux-btn"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
                </button>

                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noreferrer"
                  className="mobile-aux-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ExternalLink size={16} />
                  <span>Telegram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HERO СЕКЦИЯ С КРИВИЗНОЙ ПЛАНЕТЫ */}
      <section id="hero" className="cinematic-hero">
        <div className="space-particles" />
        <div className="planet-horizon-curve" />

        <div className="hero-content-grid">
          <div className="hero-text-block">
            <span className="hero-kicker-caps">ЭКОСИСТЕМА AI-АВТОМАТИЗАЦИИ</span>

            <h1 className="hero-giant-title">
              NOVA <span className="gold-letter">A</span>I
            </h1>

            <h2 className="hero-subheading">
              Автоматизируем бизнес-процессы с помощью AI
            </h2>

            <p className="hero-description">
              Находим ручную работу, рассчитываем потенциальный эффект и внедряем виртуальных специалистов,
              которые экономят время и сокращают рутину команды.
            </p>

            <div className="hero-actions-row">
              <button
                className="btn-hero-primary-gold"
                onClick={() => onStartBuilder('prod-single')}
              >
                <span>Собрать конфигурацию</span>
                <span className="btn-icon">↗</span>
              </button>

              <a href="#products" className="btn-hero-link-arrow">
                <span>Форматы решений</span>
                <ArrowRight size={17} />
              </a>
            </div>
          </div>

          <div className="hero-visual-block">
            <div className="beacon-wrapper">
              <NovaBeaconOrbit size={480} />
            </div>
          </div>
        </div>

        {/* НИЖНЯЯ ПАНЕЛЬ ИЗ ТРЕХ КОЛОНОК */}
        <div className="hero-ticker-bar">
          <div className="ticker-item">
            <div className="ticker-icon">
              <Search size={22} />
            </div>
            <div className="ticker-text">
              <strong>Найти</strong>
              <p>Ручную работу, повторы и узкие места в регламентах</p>
            </div>
          </div>

          <div className="ticker-item">
            <div className="ticker-icon">
              <Calculator size={22} />
            </div>
            <div className="ticker-text">
              <strong>Посчитать</strong>
              <p>Точную смету запуска и окупаемость в интерактивном конструкторе</p>
            </div>
          </div>

          <div className="ticker-item">
            <div className="ticker-icon">
              <Cpu size={22} />
            </div>
            <div className="ticker-text">
              <strong>Автоматизировать</strong>
              <p>Готовыми коннекторами или индивидуальной разработкой контура</p>
            </div>
          </div>
        </div>
      </section>

      {/* СЕКЦИЯ ПРЕИМУЩЕСТВ КОНСТРУКТОРА */}
      <section className="landing-section advantages-section">
        <div className="section-head-center">
          <span className="hero-kicker-caps">ПРЕИМУЩЕСТВА КОНСТРУКТОРА</span>
          <h2>Прозрачный расчёт без скрытых платежей</h2>
          <p>
            Спроектируйте архитектуру AI-агентов под ваши регламенты и получите официальную смету за 3 минуты.
          </p>
        </div>

        <div className="advantages-grid">
          <div className="adv-card">
            <div className="adv-icon"><Zap size={22} /></div>
            <h4>Быстрый запуск от 5 дней</h4>
            <p>Готовые коннекторы к Telegram, VK, CRM и почте позволяют запустить агента в работу за 1 неделю.</p>
          </div>
          <div className="adv-card">
            <div className="adv-icon"><ShieldCheck size={22} /></div>
            <h4>Изолированный контур KVM</h4>
            <p>Выделенная виртуальная машина для каждого клиента. Ваши данные и базы знаний не покидают защищённый периметр.</p>
          </div>
          <div className="adv-card">
            <div className="adv-icon"><Calculator size={22} /></div>
            <h4>Себестоимость токенов 0%</h4>
            <p>Возможность подключить свой API-ключ или оплачивать токены без скрытых агентских наценок.</p>
          </div>
          <div className="adv-card">
            <div className="adv-icon"><FileCheck size={22} /></div>
            <h4>Официальное КП в PDF</h4>
            <p>Мгновенная выгрузка детализированного коммерческого предложения с графиком внедрения для руководства.</p>
          </div>
        </div>
      </section>

      {/* СЕКЦИЯ ГОТОВЫХ ФОРМАТОВ (ПРОДУКТОВ) */}
      <section id="products" className="landing-section">
        <div className="section-head-center">
          <span className="hero-kicker-caps">ГОТОВЫЕ ФОРМАТЫ</span>
          <h2>Выберите решение для запуска</h2>
          <p>Каждый продукт конфигурируется в интерактивном окне с прозрачным расчётом стоимости.</p>
        </div>

        <div className="cards-grid">
          <div className="landing-card">
            <div>
              <h3>Один AI-агент</h3>
              <p>Готовый виртуальный сотрудник под одну роль: SMM-ассистент, методист или оператор первой линии поддержки.</p>
            </div>
            <div className="card-bottom">
              <div className="card-price">от 15 000 ₽</div>
              <button
                className="btn-card-gold"
                onClick={() => onStartBuilder('prod-single')}
              >
                Собрать в конструкторе
              </button>
            </div>
          </div>

          <div className="landing-card featured">
            <div>
              <h3>Комплект AI-агентов</h3>
              <p>Связка из 2+ ассистентов с распределением ролей, разграничением доступов и общей базой знаний организации.</p>
            </div>
            <div className="card-bottom">
              <div className="card-price">от 35 000 ₽</div>
              <button
                className="btn-card-gold"
                onClick={() => onStartBuilder('prod-bundle')}
              >
                Собрать в конструкторе
              </button>
            </div>
          </div>

          <div className="landing-card">
            <div>
              <h3>Индивидуальное решение</h3>
              <p>Нестандартные интеграции с 1С/ERP, ручная очистка больших архивов и кастомные голосовые сценарии.</p>
            </div>
            <div className="card-bottom">
              <div className="card-price">По согласованию</div>
              <button
                className="btn-card-gold"
                onClick={() => onStartBuilder('prod-custom')}
              >
                Индивидуальный расчёт
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* СЕКЦИЯ ПРИМЕРОВ ГОТОВЫХ КОНФИГУРАЦИЙ (ПРЕСЕТОВ) */}
      <section id="presets" className="landing-section presets-section">
        <div className="section-head-center">
          <span className="hero-kicker-caps">ГОТОВЫЕ СЦЕНАРИИ</span>
          <h2>Примеры популярных конфигураций</h2>
          <p>
            Выберите типовой сценарий и настройте его под свои параметры в конструкторе за один клик.
          </p>
        </div>

        <div className="presets-grid">
          {PRESETS.map(preset => (
            <div key={preset.id} className="preset-card">
              <div className="preset-head">
                <span className="preset-tag">{preset.badge}</span>
                <span className="preset-price">{preset.priceFrom}</span>
              </div>
              <h3 className="preset-title">{preset.title}</h3>
              <p className="preset-desc">{preset.description}</p>
              <div className="preset-tags-list">
                {preset.tags.map((t, idx) => (
                  <span key={idx} className="preset-item-tag">✓ {t}</span>
                ))}
              </div>
              <div className="preset-bottom">
                <small className="preset-meta">{preset.setupPrice}</small>
                <button
                  className="btn-card-gold"
                  onClick={() => onStartBuilder(preset.productId)}
                >
                  Загрузить в конструктор →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* СЕКЦИЯ ПОЯСНЕНИЯ МОДЕЛИ ОПЛАТЫ */}
      <section id="pricing-model" className="landing-section pricing-model-section">
        <div className="section-head-center">
          <span className="hero-kicker-caps">ПРОЗРАЧНЫЕ УСЛОВИЯ</span>
          <h2>Как устроена модель оплаты</h2>
          <p>
            Мы разделяем разовые работы по запуску, ежемесячное сопровождение и затраты на нейросети.
          </p>
        </div>

        <div className="pricing-columns">
          <div className="pricing-col">
            <span className="col-num">01</span>
            <h4>Разовый запуск (Setup)</h4>
            <p>
              Проектирование промптов, загрузка базы знаний (RAG), тестирование сценариев, развёртывание
              выделенного контура и подключение необходимых шлюзов.
            </p>
          </div>
          <div className="pricing-col">
            <span className="col-num">02</span>
            <h4>Ежемесячная поддержка</h4>
            <p>
              Выделенная инфраструктура Proxmox, обновление коннекторов API, мониторинг доступности 24/7,
              техническая поддержка и резервное копирование базы знаний.
            </p>
          </div>
          <div className="pricing-col">
            <span className="col-num">03</span>
            <h4>Бюджет токенов AI</h4>
            <p>
              Оплата языковых моделей строго по факту их использования без скрытой маржи. Вы можете использовать
              свой корпоративный ключ или единый баланс Nova.
            </p>
          </div>
        </div>
      </section>

      {/* СЕКЦИЯ FAQ */}
      <section id="faq" className="landing-section faq-section">
        <div className="section-head-center">
          <span className="hero-kicker-caps">ВОПРОСЫ И ОТВЕТЫ</span>
          <h2>Часто задаваемые вопросы</h2>
          <p>Всё, что важно знать о процессе проектирования, интеграции и сопровождении AI-агентов.</p>
        </div>

        <div className="faq-accordion">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx
            return (
              <div
                key={idx}
                className={`faq-item ${isOpen ? 'open' : ''}`}
                onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
              >
                <div className="faq-question">
                  <strong>{faq.q}</strong>
                  <span className="faq-toggle">{isOpen ? '−' : '+'}</span>
                </div>
                {isOpen && <div className="faq-answer">{faq.a}</div>}
              </div>
            )
          })}
        </div>
      </section>

      {/* ФУТЕР */}
      <footer className="cinematic-footer">
        <div className="footer-left">
          <NovaLogo size={20} />
          <span>© {new Date().getFullYear()} Nova AI Operations. Все права защищены.</span>
        </div>
        <div className="footer-right">
          <span>* Все предварительные расчёты в конструкторе носят ознакомительный характер и не являются публичной офертой.</span>
        </div>
      </footer>
    </div>
  )
}
