export const profile = {
  name: 'Piyush Priyanshu',
  role: 'Data Analyst',
  roles: ['Data Analyst', 'ML Engineer', 'Data Scientist', 'Dashboard Builder'],
  tagline:
    'I turn fragmented, messy data into predictive models and decision-ready dashboards — from 3GB+ financial record joins to RAG pipelines and live market forecasting.',
  location: 'Jalandhar, Punjab, India',
  email: 'piyushpriyanshu72@gmail.com',
  phone: '+91 95760 75928',
  phoneHref: '+919576075928',
  resume: 'Piyush_Priyanshu_Resume.pdf',
  socials: [
    {
      label: 'GitHub',
      handle: 'piyushp69',
      href: 'https://github.com/piyushp69',
      icon: 'github',
    },
    {
      label: 'LinkedIn',
      handle: 'piyush-priyanshu',
      href: 'https://linkedin.com/in/piyush-priyanshu',
      icon: 'linkedin',
    },
    {
      label: 'Email',
      handle: 'piyushpriyanshu72@gmail.com',
      href: 'mailto:piyushpriyanshu72@gmail.com',
      icon: 'mail',
    },
  ],
}

export const stats = [
  { value: '8.96', label: 'CGPA', detail: 'B.Tech CSE, LPU' },
  { value: '3', label: 'Flagship Projects', detail: 'ML · RAG · BI' },
  { value: '+22%', label: 'Predictive Recall', detail: 'Credit risk model' },
  { value: '50+', label: 'Algorithms Benchmarked', detail: 'DSA bootcamp' },
]

export const about = {
  headline: 'Data analyst with an engineer’s bias for shipping.',
  paragraphs: [
    'I am a Computer Science undergraduate at Lovely Professional University (CGPA 8.96) working at the intersection of data analysis, machine learning and product engineering. Most of my work starts the same way: a pile of fragmented records nobody trusts, and a decision somebody needs to make this week.',
    'I have built GPU-accelerated credit-risk models with XGBoost and LightGBM, orchestrated eight-stage ETL pipelines with RAG-based catalogue enrichment, and streamed live market data into Streamlit dashboards. Alongside that, a DSA bootcamp and a Deloitte data analytics simulation sharpened how I reason about complexity and data hygiene.',
    'I care about the last mile — SHAP explanations inside a Power BI report, a confidence-gated review queue, a KPI panel a stakeholder actually opens. A model nobody can act on is a model that never shipped.',
  ],
  facts: [
    { label: 'Based in', value: 'Jalandhar, Punjab' },
    { label: 'Focus', value: 'Predictive Modelling & BI' },
    { label: 'Degree', value: 'B.Tech CSE · 2024–Present' },
    { label: 'Open to', value: 'Data Analyst / ML Roles' },
  ],
}

export const skillGroups = [
  {
    id: 'languages',
    title: 'Languages',
    icon: 'code',
    blurb: 'Core languages I write day to day.',
    items: ['Python', 'SQL', 'C++', 'Java', 'JavaScript'],
  },
  {
    id: 'libraries',
    title: 'Libraries & Frameworks',
    icon: 'layers',
    blurb: 'The modelling and data stack behind my projects.',
    items: [
      'PyTorch',
      'Pandas',
      'NumPy',
      'Scikit-Learn',
      'spaCy',
      'Seaborn',
      'FastAPI',
    ],
  },
  {
    id: 'tools',
    title: 'Tools & Platforms',
    icon: 'tool',
    blurb: 'Where I build, version, visualise and deploy.',
    items: ['Git / GitHub', 'Google Colab', 'Power BI', 'JupyterLab', 'Docker'],
  },
  {
    id: 'methods',
    title: 'Methodologies',
    icon: 'chart',
    blurb: 'How I approach a modelling problem end to end.',
    items: [
      'Machine Learning',
      'Feature Engineering',
      'Predictive Modeling',
      'Model Evaluation',
      'Time-Series Forecasting',
    ],
  },
  {
    id: 'soft',
    title: 'Soft Skills',
    icon: 'users',
    blurb: 'How I work with the people around the data.',
    items: [
      'Decision-Making',
      'Problem-Solving',
      'Cross-Functional Collaboration',
      'Multi-tasking',
    ],
  },
]

// The tool marquee under the hero.
export const tools = [
  'Python',
  'SQL',
  'PyTorch',
  'Pandas',
  'Scikit-Learn',
  'XGBoost',
  'Power BI',
  'Docker',
  'FastAPI',
  'Git',
]

// The three parts of every project's story, in order.
export const projectStory = [
  { key: 'problem', label: 'Problem' },
  { key: 'approach', label: 'Approach' },
  { key: 'result', label: 'Result' },
]

// Each card reads Problem -> Approach -> Result, with the first metric as its
// corner badge. Add `image: 'projects/<id>.webp'` (a file in public/) to show
// a screenshot; without one the card draws an illustrated cover.
export const projects = [
  {
    id: 'credscore',
    title: 'CredScore',
    subtitle: 'Explainable credit-risk scoring at scale',
    period: 'Aug 2026',
    status: 'Live',
    demo: 'https://credscorelive.streamlit.app/',
    tags: ['XGBoost', 'LightGBM', 'Power BI', 'Python', 'Pandas'],
    categories: ['Machine Learning', 'Analytics'],
    problem:
      'Predict loan defaults from 3GB+ of fragmented financial records spread across 5 datasets, and let risk teams see why a score moved.',
    approach:
      'Relational joins in Python and Pandas built the feature space; GPU-accelerated XGBoost and LightGBM models, with SMOTE for class imbalance, predict defaults; SHAP values explain each score inside a Power BI dashboard.',
    result:
      'Predictive recall up 22%, and risk reporting that accelerated decision-making by 40%.',
    highlights: [
      'Architected a predictive feature space using Python and Pandas, executing complex relational joins across 3GB+ (5 datasets) of fragmented financial records.',
      'Developed a GPU-accelerated credit risk model using XGBoost and LightGBM to predict defaults, utilizing SMOTE for class imbalance to boost predictive recall by 22%.',
      'Designed an interactive Power BI dashboard integrating SHAP values to decode ML outputs, delivering risk assessment reporting that accelerated decision-making by 40%.',
    ],
    metrics: [
      { value: '+22%', label: 'Predictive recall' },
      { value: '40%', label: 'Faster decisions' },
      { value: '3GB+', label: 'Records joined' },
    ],
    accent: 'honey',
  },
  {
    id: 'product-intelligence',
    title: 'Product Intelligence Engine',
    subtitle: 'Catalogue enrichment with RAG and an adversarial LLM judge',
    period: 'Jul 2026',
    status: 'Live',
    demo: 'https://catalog-intelligence-engine.streamlit.app/',
    tags: ['RAG', 'LLM', 'FastAPI', 'spaCy', 'SQL'],
    categories: ['AI / LLM', 'Data Engineering'],
    problem:
      'Product catalogues written in shorthand, with inconsistent units and missing attributes, need enriching without letting data quality slip.',
    approach:
      'An 8-stage ETL pipeline with deterministic decoding parses shorthand and converts units; a FastAPI RAG system grounded in a custom spaCy knowledge graph enriches each row; an adversarial LLM judge gates results by confidence.',
    result:
      'Data quality score up from 51.2 to 78.3, a 97% fill rate with 100% taxonomy coverage, and 1,000 rows processed in 7 seconds.',
    highlights: [
      'Orchestrated an 8-stage automated Extract, Transform, Load (ETL) pipeline with deterministic decoding, executing shorthand parsing and unit conversion for 1,000 rows in 7 seconds.',
      'Deployed a FastAPI-based Retrieval-Augmented Generation (RAG) system grounded in a custom spaCy knowledge graph, enhancing enriched data quality scores from 51.2 to 78.3.',
      'Integrated an adversarial Large Language Model (LLM) judge with a confidence-gated review system, achieving a 97% data fill rate and 100% taxonomy coverage.',
    ],
    metrics: [
      { value: '51.2 → 78.3', label: 'Data quality score' },
      { value: '97%', label: 'Data fill rate' },
      { value: '1k rows / 7s', label: 'ETL throughput' },
    ],
    accent: 'terracotta',
  },
  {
    id: 'tradeflow',
    title: 'TradeFlow AI',
    subtitle: 'Real-time market forecasting dashboard',
    period: 'Jan 2026',
    status: 'Live',
    demo: 'https://tradeflowai.streamlit.app/',
    tags: ['XGBoost', 'yfinance', 'Streamlit', 'Scikit-Learn'],
    categories: ['Machine Learning', 'Analytics'],
    problem:
      'Turn live market prices into directional predictions quickly enough to act on.',
    approach:
      'An automated yfinance pipeline streams real-time prices; engineered technical indicators feed an XGBoost time-series model trained with Scikit-Learn; a Streamlit app serves live tracking, predictions and KPIs.',
    result:
      '64% directional accuracy on data streamed with sub-800ms latency, in a dashboard processing 1,200+ data points per minute.',
    highlights: [
      'Constructed an automated yfinance API data pipeline to stream real-time market data with sub-800ms latency for live prediction workflows.',
      'Trained an XGBoost ML model for time-series predictive analytics using Scikit-Learn, engineering technical indicators to achieve 64% directional accuracy.',
      'Launched a Streamlit web app for live stock tracking, predictive insights, and KPI reporting, translating models into a dashboard processing 1,200+ data points per minute.',
    ],
    metrics: [
      { value: '64%', label: 'Directional accuracy' },
      { value: '<800ms', label: 'Stream latency' },
      { value: '1,200+/min', label: 'Data points' },
    ],
    accent: 'honey',
  },
]

export const training = [
  {
    id: 'dsa-bootcamp',
    title: 'DSA Bootcamp: Master Data Structures & Algorithms',
    org: 'LPU Summer Internship',
    period: 'Jul 2026',
    tags: ['C++17', 'Graph Algorithms', 'Dynamic Programming'],
    points: [
      'Developed “LifeLine”, a zero-dependency C++17 disaster response simulation system powered by custom priority heaps and 10+ graph traversal algorithms to reduce emergency routing latency threefold.',
      'Optimized memory management overhead by implementing cache-aligned data structures and dynamic programming patterns, accelerating overall execution throughput by 35% in high-load testing.',
      'Rigorously benchmarked and stress-tested 50+ custom algorithmic routines under extreme edge conditions, locking in O(N log N) average-case time complexity and eliminating thread concurrency bottlenecks.',
    ],
  },
  {
    id: 'deloitte-simulation',
    title: 'Data Analytics Job Simulation',
    org: 'Deloitte · Virtual Experience (Forage)',
    period: 'Feb 2026',
    tags: ['Data Profiling', 'Forensic Analytics', 'Dashboards'],
    points: [
      'Executed enterprise-level data analysis and forensic technology workflows, identifying data anomalies across 50,000+ transactional records to uncover hidden business insights.',
      'Performed comprehensive data profiling and root-cause analysis to validate data hygiene, ensuring 100% schema integrity for structured financial reporting.',
      'Delivered actionable, data-driven recommendations and interactive visual dashboards to support complex business scenarios and stakeholder decision-making.',
    ],
  },
]

export const certificates = [
  {
    id: 'genai',
    title: 'Generative AI',
    issuer: 'Udemy',
    date: 'Aug 2026',
    url: 'https://drive.google.com/file/d/1baD3J_2qjLier3GQbE7Iha8OX5_q_KD2/view',
  },
  {
    id: 'dbms',
    title: 'Database Management System',
    issuer: 'Infosys',
    date: 'Jul 2026',
    url: 'https://drive.google.com/file/d/19Ec_RRIZOD8j4xHwahwStRsGRpMWDoY8/view',
  },
  {
    id: 'oracle-ai',
    title: 'Oracle Certified AI Foundations Associate',
    issuer: 'Oracle',
    date: 'Jun 2026',
    url: 'https://drive.google.com/file/d/1yUb84eADPkjagx76m4Zb8h4EUXHPYBHd/view',
  },
]

export const achievements = [
  {
    id: 'flipkart',
    title: 'Flipkart Pan-India Hackathon — Round 3',
    date: 'Jan 2026',
    description:
      'Advanced to the 3rd round of Flipkart’s flagship pan-India hackathon, demonstrating advanced algorithmic thinking.',
  },
  {
    id: 'codextreme',
    title: 'CodeXtreme 4.0 — Top 30',
    date: 'Apr 2026',
    description:
      'Secured a Top 30 position in CodeXtreme 4.0, an intensive Java coding competition hosted by iamneo.',
  },
]

export const education = [
  {
    id: 'lpu',
    school: 'Lovely Professional University',
    location: 'Jalandhar, Punjab',
    degree: 'Bachelor of Technology in Computer Science and Engineering',
    score: 'CGPA: 8.96',
    period: 'Aug 2024 – Present',
  },
  {
    id: 'rps',
    school: 'RPS Public School',
    location: 'Patna, Bihar',
    degree: '12th Science',
    score: 'Percentage: 71.6%',
    period: 'Apr 2021 – May 2022',
  },
]

export const navLinks = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
]
