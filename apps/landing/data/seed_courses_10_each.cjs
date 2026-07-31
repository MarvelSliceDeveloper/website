/**
 * seed_courses_10_each.cjs
 *
 * Deletes ALL existing courses and re-seeds 10 fully-filled courses
 * under EVERY sub-category nav item that belongs to Software Learning
 * or Competitive Exam.
 *
 * Run: node data/seed_courses_10_each.cjs
 *
 * ⚠️  This WILL delete all existing courses. The data is backed up in:
 *     data/courses/courses_raw.json (run extract_all.cjs first)
 */

const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

const SUPABASE_URL      = 'https://nxlsxywqvvuiljsulito.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bHN4eXdxdnZ1aWxqc3VsaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NTU3NTEsImV4cCI6MjA5ODUzMTc1MX0.OMgBhyUiAPwsC3oPx9Htv5obXXgCPm6h9QD6KHgi3lA';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── NAV ITEM IDs (from extract) ────────────────────────────────────────────
// Sub-categories: each gets 10 courses seeded

const NAV_CATEGORIES = [
  // SOFTWARE LEARNING
  {
    id: '1c20c76e-745b-4e87-9386-ef247c9c0e61',
    label: 'Frontend',
    parent: 'Web Development',
    section: 'Software Learning',
    theme: 'web_frontend',
  },
  {
    id: 'd4f0a428-8f8c-4ae5-ba53-e27413b35647',
    label: 'Backend',
    parent: 'Web Development',
    section: 'Software Learning',
    theme: 'web_backend',
  },
  {
    id: 'd4035ea8-9af9-4cf2-902e-7777753c9e20',
    label: 'ML',
    parent: 'AI & Machine Learning',
    section: 'Software Learning',
    theme: 'ml',
  },
  {
    id: 'bb3a8a9c-2f7d-47f0-bd4e-aab2b48f94fb',
    label: 'Deep Learning',
    parent: 'AI & Machine Learning',
    section: 'Software Learning',
    theme: 'dl',
  },
  {
    id: 'd60db086-c07b-49bf-9821-821b6f0d8a77',
    label: 'Analysis',
    parent: 'Data Science & Analytics',
    section: 'Software Learning',
    theme: 'data_analysis',
  },
  {
    id: '3912b494-8d84-439c-ab45-f64c763a70ee',
    label: 'Visualization',
    parent: 'Data Science & Analytics',
    section: 'Software Learning',
    theme: 'data_viz',
  },
  {
    id: '4d7dfda2-4a74-4657-8445-04d1a037bdcb',
    label: 'Cloud',
    parent: 'Cloud Computing & DevOps',
    section: 'Software Learning',
    theme: 'cloud',
  },
  {
    id: '25b2f078-3d16-4eac-8b13-3e378c50a006',
    label: 'DevOps',
    parent: 'Cloud Computing & DevOps',
    section: 'Software Learning',
    theme: 'devops',
  },
  {
    id: '9e56aa2b-238c-45ed-b3b6-59404ae29ad0',
    label: 'Ethical Hacking',
    parent: 'Cybersecurity',
    section: 'Software Learning',
    theme: 'ethical_hacking',
  },
  {
    id: '983cb9d7-c1ae-4d86-b69d-76a8fbf4b04a',
    label: 'Network Security',
    parent: 'Cybersecurity',
    section: 'Software Learning',
    theme: 'network_security',
  },
  // COMPETITIVE EXAM
  {
    id: 'a8a63659-aeb1-434e-83aa-3eee0cb6bfa8',
    label: 'Prelims',
    parent: 'UPSC',
    section: 'Competitive Exam',
    theme: 'upsc_prelims',
  },
  {
    id: '63d726e5-f2af-4aff-9129-869e065015a6',
    label: 'Mains',
    parent: 'UPSC',
    section: 'Competitive Exam',
    theme: 'upsc_mains',
  },
  {
    id: '11a48c49-1bb3-4feb-94bc-10455a20f627',
    label: 'CGL',
    parent: 'SSC',
    section: 'Competitive Exam',
    theme: 'ssc_cgl',
  },
  {
    id: '8a446706-f65d-4b70-af18-c03c0f9dbc6d',
    label: 'CHSL',
    parent: 'SSC',
    section: 'Competitive Exam',
    theme: 'ssc_chsl',
  },
  {
    id: 'f877419b-c9f0-4e63-b5b1-c46a34b47d10',
    label: 'IBPS',
    parent: 'Banking',
    section: 'Competitive Exam',
    theme: 'ibps',
  },
  {
    id: 'd448c95f-0321-43bc-b2f6-9e089695c9b4',
    label: 'SBI',
    parent: 'Banking',
    section: 'Competitive Exam',
    theme: 'sbi',
  },
  {
    id: '42137743-8afd-427f-9a1c-38133083e28a',
    label: 'NTPC',
    parent: 'Railway',
    section: 'Competitive Exam',
    theme: 'rrb_ntpc',
  },
  {
    id: '106c75d5-d6d0-47cf-8976-d9fedacff9ed',
    label: 'Group D',
    parent: 'Railway',
    section: 'Competitive Exam',
    theme: 'rrb_gd',
  },
  {
    id: '377c600f-9758-446a-a8fd-e71dd69d02cc',
    label: 'NDA',
    parent: 'Defence',
    section: 'Competitive Exam',
    theme: 'nda',
  },
  {
    id: '578436be-0c63-48ca-a4e7-4def81ed0203',
    label: 'CDS',
    parent: 'Defence',
    section: 'Competitive Exam',
    theme: 'cds',
  },
];

// ─── COURSE TEMPLATES PER THEME ────────────────────────────────────────────

const THEMES = {

  // ── Software Learning ──────────────────────────────────────────────────

  web_frontend: [
    {
      title: 'HTML5 & CSS3 Mastery',
      subtitle: 'Build beautiful, responsive websites from scratch',
      description: 'A complete guide to modern HTML5 semantics and CSS3 including Flexbox, Grid, animations, and responsive design. You will build 5 real-world projects.',
      duration: '6 weeks', mode: 'Online', rating: 4.6, learner_count: 3200, review_count: 410,
      topics: ['HTML5 Semantic Tags','CSS3 Flexbox & Grid','Responsive Design','CSS Variables & Animations','Forms & Validation','SEO Basics','Accessibility','Web Performance'],
    },
    {
      title: 'JavaScript Fundamentals',
      subtitle: 'From zero to hero with modern JavaScript',
      description: 'Master JavaScript ES6+ including arrow functions, promises, async/await, destructuring, modules, and DOM manipulation.',
      duration: '8 weeks', mode: 'Online', rating: 4.7, learner_count: 5100, review_count: 680,
      topics: ['Variables & Data Types','Functions & Closures','DOM Manipulation','Event Handling','Promises & Async','ES6+ Features','Error Handling','Browser APIs'],
    },
    {
      title: 'React 19 Complete Course',
      subtitle: 'Build modern SPAs with React & TypeScript',
      description: 'Learn React 19 with hooks, context, server components, Suspense, and TypeScript. Build full-stack apps with Next.js integration.',
      duration: '10 weeks', mode: 'Online', rating: 4.8, learner_count: 7800, review_count: 1050,
      topics: ['JSX & Components','Hooks (useState, useEffect)','Context API','React Router','TypeScript with React','Server Components','Performance Optimization','Testing with RTL'],
    },
    {
      title: 'Vue.js 3 — The Complete Guide',
      subtitle: 'Build reactive applications with Vue 3 & Composition API',
      description: 'Comprehensive Vue.js 3 course covering Options API, Composition API, Vuex, Pinia, and Vue Router for building production apps.',
      duration: '8 weeks', mode: 'Online', rating: 4.5, learner_count: 2900, review_count: 340,
      topics: ['Vue Directives','Composition API','Pinia State Management','Vue Router','Component Patterns','Vuex Migration','Testing','SSR with Nuxt'],
    },
    {
      title: 'Angular 17 Enterprise Development',
      subtitle: 'Master Angular for large-scale applications',
      description: 'Deep dive into Angular 17 with signals, standalone components, RxJS, NgRx, and enterprise-grade architecture patterns.',
      duration: '12 weeks', mode: 'Online', rating: 4.4, learner_count: 2100, review_count: 270,
      topics: ['Angular CLI & Modules','Components & Templates','Services & DI','Reactive Forms','RxJS Observables','NgRx State Management','Lazy Loading','Unit & E2E Testing'],
    },
    {
      title: 'TypeScript Advanced Patterns',
      subtitle: 'Write type-safe code like a pro',
      description: 'Advanced TypeScript covering generics, decorators, utility types, mapped types, conditional types, and integrating TS with popular frameworks.',
      duration: '6 weeks', mode: 'Online', rating: 4.7, learner_count: 3600, review_count: 490,
      topics: ['Type System Basics','Generics & Constraints','Utility Types','Mapped & Conditional Types','Decorators','Declaration Files','Strict Mode','TS with React/Node'],
    },
    {
      title: 'Tailwind CSS & Modern UI',
      subtitle: 'Craft stunning UIs with utility-first CSS',
      description: 'Master Tailwind CSS v4, dark mode, animations, custom plugins, and pairing it with component libraries like shadcn/ui and Radix.',
      duration: '4 weeks', mode: 'Online', rating: 4.6, learner_count: 4200, review_count: 560,
      topics: ['Utility-First Concepts','Responsive Breakpoints','Dark Mode','Custom Plugins','shadcn/ui','Framer Motion','Figma to Code','Accessibility'],
    },
    {
      title: 'Next.js 14 Full-Stack',
      subtitle: 'Build production-ready apps with the React framework',
      description: 'Complete Next.js 14 course: App Router, Server Actions, API routes, authentication, database integration with Prisma, and deployment on Vercel.',
      duration: '10 weeks', mode: 'Online', rating: 4.9, learner_count: 8900, review_count: 1200,
      topics: ['App Router','Server & Client Components','Server Actions','Data Fetching','Authentication','Prisma ORM','Edge Functions','CI/CD & Deployment'],
    },
    {
      title: 'Web Performance & Optimization',
      subtitle: 'Make websites blazing fast',
      description: 'Learn Core Web Vitals, code splitting, lazy loading, image optimization, caching strategies, CDN configuration, and performance monitoring.',
      duration: '5 weeks', mode: 'Online', rating: 4.5, learner_count: 1800, review_count: 220,
      topics: ['Core Web Vitals','Code Splitting','Image Optimization','Caching Strategies','Service Workers','Bundle Analysis','Lighthouse','Real User Monitoring'],
    },
    {
      title: 'Frontend System Design',
      subtitle: 'Architect scalable frontend applications',
      description: 'Learn how to design large-scale frontend systems including micro-frontends, design systems, state management architecture, and API layer design.',
      duration: '8 weeks', mode: 'Online', rating: 4.7, learner_count: 2500, review_count: 310,
      topics: ['Micro-Frontends','Design Systems','State Architecture','Module Federation','Monorepo with Nx','API Layer Patterns','Authentication Architecture','Performance at Scale'],
    },
  ],

  web_backend: [
    {
      title: 'Node.js & Express Complete Course',
      subtitle: 'Build scalable REST APIs with Node.js',
      description: 'Master Node.js, Express.js, middleware, authentication, file uploads, WebSockets, and production deployment with Docker.',
      duration: '10 weeks', mode: 'Online', rating: 4.7, learner_count: 5600, review_count: 720,
      topics: ['Node.js Runtime','Express Routing','Middleware Patterns','JWT Authentication','File Uploads','WebSockets','Error Handling','Docker Deployment'],
    },
    {
      title: 'Python Django Full-Stack',
      subtitle: 'Web development with Python\'s most popular framework',
      description: 'Comprehensive Django course covering ORM, views, templates, REST API with DRF, Celery for background tasks, and deployment.',
      duration: '12 weeks', mode: 'Online', rating: 4.6, learner_count: 4100, review_count: 530,
      topics: ['Django ORM','Class-Based Views','Django REST Framework','Authentication','Celery & Redis','PostgreSQL','Testing','Deployment on AWS'],
    },
    {
      title: 'PostgreSQL & Database Design',
      subtitle: 'Master relational databases for modern applications',
      description: 'Deep dive into PostgreSQL: schema design, indexing, query optimization, JSONB, full-text search, replication, and advanced SQL.',
      duration: '8 weeks', mode: 'Online', rating: 4.8, learner_count: 3200, review_count: 420,
      topics: ['Schema Design','ACID & Transactions','Indexes & Query Plans','JSONB & Arrays','Full-Text Search','Stored Procedures','Replication','PgBouncer'],
    },
    {
      title: 'GraphQL API Development',
      subtitle: 'Build flexible APIs with GraphQL & Apollo',
      description: 'Learn to design and build GraphQL APIs with Apollo Server, subscriptions, N+1 problem solutions, and client-side integration.',
      duration: '7 weeks', mode: 'Online', rating: 4.5, learner_count: 2300, review_count: 290,
      topics: ['Schema-First Design','Resolvers & Context','Mutations & Queries','Subscriptions','DataLoader','Apollo Studio','Authentication','Federation'],
    },
    {
      title: 'Microservices with Docker & Kubernetes',
      subtitle: 'Build and deploy microservice architectures',
      description: 'Design microservices with gRPC, message queues, API gateways, containerize with Docker, and orchestrate with Kubernetes.',
      duration: '14 weeks', mode: 'Online', rating: 4.7, learner_count: 3800, review_count: 480,
      topics: ['Service Design','gRPC Communication','Message Queues (RabbitMQ)','API Gateway','Docker Compose','Kubernetes Fundamentals','Helm Charts','Service Mesh'],
    },
    {
      title: 'Go Language for Backend',
      subtitle: 'Build high-performance services with Golang',
      description: 'Learn Go from scratch: goroutines, channels, interfaces, building REST APIs, gRPC services, and writing production-grade Go code.',
      duration: '10 weeks', mode: 'Online', rating: 4.6, learner_count: 2700, review_count: 340,
      topics: ['Go Syntax & Types','Goroutines & Channels','Interfaces','REST with Gin','gRPC with protobuf','Testing in Go','Database Access','Deployment'],
    },
    {
      title: 'FastAPI & Modern Python APIs',
      subtitle: 'Build lightning-fast APIs with FastAPI',
      description: 'Complete FastAPI guide: async endpoints, Pydantic models, dependency injection, OAuth2, background tasks, and Docker deployment.',
      duration: '7 weeks', mode: 'Online', rating: 4.8, learner_count: 3900, review_count: 510,
      topics: ['FastAPI Basics','Pydantic V2','Dependency Injection','Async/Await','OAuth2 & JWT','Background Tasks','WebSockets','Docker & CI/CD'],
    },
    {
      title: 'MongoDB & NoSQL Design',
      subtitle: 'Document databases for modern applications',
      description: 'Master MongoDB: schema design, aggregation pipeline, indexes, transactions, Atlas Search, and integrating with Node.js and Python.',
      duration: '6 weeks', mode: 'Online', rating: 4.4, learner_count: 2100, review_count: 270,
      topics: ['Document Modeling','CRUD Operations','Aggregation Pipeline','Indexes','Transactions','Atlas Search','Change Streams','Mongoose ODM'],
    },
    {
      title: 'Redis & Caching Strategies',
      subtitle: 'Supercharge your apps with Redis',
      description: 'Redis from beginner to advanced: data structures, pub/sub, Lua scripting, Redis Streams, caching patterns, and Redis Cluster.',
      duration: '5 weeks', mode: 'Online', rating: 4.6, learner_count: 1900, review_count: 240,
      topics: ['Data Structures','Pub/Sub','Lua Scripting','Streams','Session Management','Rate Limiting','Redis Cluster','ioRedis & node-redis'],
    },
    {
      title: 'Backend Security & Best Practices',
      subtitle: 'Secure your backend applications',
      description: 'Learn backend security: OWASP Top 10, SQL injection, XSS, CSRF, JWT best practices, rate limiting, input validation, and pen testing basics.',
      duration: '6 weeks', mode: 'Online', rating: 4.7, learner_count: 2400, review_count: 310,
      topics: ['OWASP Top 10','SQL Injection Prevention','XSS & CSRF','JWT Security','Rate Limiting','Input Validation','Secure Headers','Penetration Testing'],
    },
  ],

  ml: [
    {
      title: 'Machine Learning Foundations',
      subtitle: 'Start your ML journey from first principles',
      description: 'Comprehensive introduction to machine learning: supervised, unsupervised learning, model evaluation, and feature engineering with scikit-learn.',
      duration: '10 weeks', mode: 'Online', rating: 4.7, learner_count: 6200, review_count: 820,
      topics: ['Linear Regression','Logistic Regression','Decision Trees','Random Forests','SVM','K-Means Clustering','Model Evaluation','Feature Engineering'],
    },
    {
      title: 'Python for Data Science',
      subtitle: 'NumPy, Pandas, Matplotlib and more',
      description: 'Master the Python data science stack: NumPy, Pandas, Matplotlib, Seaborn, and SciPy for data wrangling and analysis.',
      duration: '8 weeks', mode: 'Online', rating: 4.6, learner_count: 7400, review_count: 960,
      topics: ['NumPy Arrays','Pandas DataFrames','Data Cleaning','Exploratory Analysis','Matplotlib Plots','Seaborn','Statistical Testing','Case Studies'],
    },
    {
      title: 'Natural Language Processing',
      subtitle: 'Build language understanding models',
      description: 'NLP from tokenization to transformers: text preprocessing, word embeddings, sentiment analysis, named entity recognition, and BERT fine-tuning.',
      duration: '12 weeks', mode: 'Online', rating: 4.8, learner_count: 4800, review_count: 630,
      topics: ['Tokenization','Word2Vec & GloVe','Sentiment Analysis','NER','Text Classification','Seq2Seq','Transformers','BERT Fine-tuning'],
    },
    {
      title: 'Recommendation Systems',
      subtitle: 'Build Netflix-style recommender engines',
      description: 'Design recommendation systems: collaborative filtering, content-based filtering, matrix factorization, and neural collaborative filtering.',
      duration: '8 weeks', mode: 'Online', rating: 4.5, learner_count: 2900, review_count: 370,
      topics: ['Collaborative Filtering','Content-Based Filtering','Matrix Factorization','SVD','ALS','Neural CF','Cold Start Problem','A/B Testing'],
    },
    {
      title: 'Time Series Analysis & Forecasting',
      subtitle: 'Predict future trends from temporal data',
      description: 'Complete time series course: ARIMA, SARIMA, Prophet, LSTM-based forecasting, and anomaly detection for financial and operational data.',
      duration: '9 weeks', mode: 'Online', rating: 4.6, learner_count: 3400, review_count: 430,
      topics: ['Stationarity Tests','ARIMA & SARIMA','Exponential Smoothing','Prophet','LSTM Forecasting','Anomaly Detection','Backtesting','Real-world Case Studies'],
    },
    {
      title: 'Reinforcement Learning',
      subtitle: 'Train agents to make optimal decisions',
      description: 'Learn RL from Markov Decision Processes to advanced algorithms: Q-learning, Deep Q-Network, PPO, and training game-playing agents.',
      duration: '12 weeks', mode: 'Online', rating: 4.7, learner_count: 2200, review_count: 280,
      topics: ['MDP & Bellman Equation','Q-Learning','Deep Q-Network','Policy Gradient','Actor-Critic','PPO','Multi-Agent RL','OpenAI Gym Projects'],
    },
    {
      title: 'Feature Engineering & Model Selection',
      subtitle: 'The craft of building better ML models',
      description: 'Advanced feature engineering: handling missing data, encoding, binning, feature interaction, cross-validation strategies, and hyperparameter tuning.',
      duration: '7 weeks', mode: 'Online', rating: 4.5, learner_count: 3100, review_count: 400,
      topics: ['Missing Data Strategies','Encoding Techniques','Feature Scaling','Feature Selection','Cross-Validation','Grid & Random Search','Bayesian Optimization','AutoML'],
    },
    {
      title: 'XGBoost, LightGBM & Ensemble Methods',
      subtitle: 'Win Kaggle competitions with gradient boosting',
      description: 'Master ensemble methods: bagging, boosting, stacking, XGBoost, LightGBM, and CatBoost with practical Kaggle competition strategies.',
      duration: '7 weeks', mode: 'Online', rating: 4.8, learner_count: 4500, review_count: 590,
      topics: ['Bagging & Random Forest','AdaBoost','Gradient Boosting Theory','XGBoost Deep Dive','LightGBM','CatBoost','Stacking','Kaggle Strategy'],
    },
    {
      title: 'MLOps & Model Deployment',
      subtitle: 'Take ML models to production',
      description: 'Complete MLOps pipeline: experiment tracking with MLflow, model serving with FastAPI, CI/CD for ML, monitoring with Grafana, and Docker/Kubernetes.',
      duration: '10 weeks', mode: 'Online', rating: 4.7, learner_count: 3700, review_count: 470,
      topics: ['Experiment Tracking (MLflow)','Model Registry','FastAPI Serving','Docker for ML','Kubernetes Deployment','CI/CD with GitHub Actions','Data Drift Monitoring','Airflow Pipelines'],
    },
    {
      title: 'Generative AI & LLMs',
      subtitle: 'Build applications with large language models',
      description: 'Practical LLM development: prompt engineering, RAG systems, LangChain, fine-tuning with LoRA, vector databases, and building AI assistants.',
      duration: '12 weeks', mode: 'Online', rating: 4.9, learner_count: 9800, review_count: 1300,
      topics: ['Prompt Engineering','LangChain & LlamaIndex','RAG Architecture','Vector Databases','Fine-tuning with LoRA','OpenAI & Anthropic APIs','Safety & Alignment','Production Deployment'],
    },
  ],

  dl: [
    {
      title: 'Neural Networks from Scratch',
      subtitle: 'Understand deep learning at its core',
      description: 'Build neural networks from scratch with NumPy, then transition to PyTorch. Covers forward/backward pass, activation functions, and optimization.',
      duration: '8 weeks', mode: 'Online', rating: 4.7, learner_count: 3900, review_count: 510,
      topics: ['Perceptrons','Activation Functions','Backpropagation','NumPy Implementation','PyTorch Basics','Optimizers','Regularization','Mini-batch Training'],
    },
    {
      title: 'Convolutional Neural Networks',
      subtitle: 'Computer vision with deep learning',
      description: 'Complete CNN course: image classification, object detection with YOLO, image segmentation, and transfer learning with ResNet and EfficientNet.',
      duration: '10 weeks', mode: 'Online', rating: 4.8, learner_count: 5100, review_count: 670,
      topics: ['Convolution Operation','Pooling Layers','ResNet & VGG','Transfer Learning','YOLO Object Detection','Semantic Segmentation','GANs','Data Augmentation'],
    },
    {
      title: 'Transformers & Attention Mechanisms',
      subtitle: 'The architecture behind modern AI',
      description: 'Deep dive into attention mechanisms, transformer architecture, vision transformers, and implementing BERT and GPT from scratch.',
      duration: '12 weeks', mode: 'Online', rating: 4.9, learner_count: 6200, review_count: 830,
      topics: ['Self-Attention','Multi-Head Attention','Positional Encoding','BERT Architecture','GPT Architecture','ViT','CLIP','Fine-tuning Strategies'],
    },
    {
      title: 'Generative Adversarial Networks',
      subtitle: 'Create images, audio, and video with AI',
      description: 'Complete GAN course: vanilla GAN, DCGAN, StyleGAN, conditional GAN, and diffusion models for image and video generation.',
      duration: '10 weeks', mode: 'Online', rating: 4.7, learner_count: 3300, review_count: 430,
      topics: ['GAN Theory','DCGAN','Progressive Growing','StyleGAN2','Conditional GAN','CycleGAN','Diffusion Models','Stable Diffusion'],
    },
    {
      title: 'Graph Neural Networks',
      subtitle: 'Deep learning on graph-structured data',
      description: 'GNNs for molecular property prediction, social network analysis, and recommendation systems using PyTorch Geometric.',
      duration: '9 weeks', mode: 'Online', rating: 4.6, learner_count: 1800, review_count: 230,
      topics: ['Graph Theory Basics','Message Passing','GCN & GraphSAGE','GAT','Graph Classification','Link Prediction','Molecular GNNs','PyTorch Geometric'],
    },
    {
      title: 'Recurrent Neural Networks & LSTM',
      subtitle: 'Sequential data modeling',
      description: 'RNNs, LSTMs, GRUs for sequence modeling: time series, text generation, machine translation, and speech recognition.',
      duration: '8 weeks', mode: 'Online', rating: 4.5, learner_count: 2700, review_count: 350,
      topics: ['Vanilla RNN','LSTM Architecture','GRU','Bidirectional RNNs','Seq2Seq','Attention in RNNs','Text Generation','Speech Recognition'],
    },
    {
      title: 'PyTorch Advanced',
      subtitle: 'Master the most popular DL framework',
      description: 'Advanced PyTorch: custom autograd, distributed training, quantization, JIT compilation, and deploying models with TorchServe.',
      duration: '9 weeks', mode: 'Online', rating: 4.7, learner_count: 3100, review_count: 400,
      topics: ['Custom Autograd','DataLoader & Samplers','Distributed Training','Mixed Precision','Quantization','TorchScript','TorchServe','ONNX Export'],
    },
    {
      title: 'Computer Vision Applications',
      subtitle: 'Build real-world vision systems',
      description: 'End-to-end computer vision projects: face recognition, pose estimation, action recognition, and medical image analysis.',
      duration: '10 weeks', mode: 'Online', rating: 4.8, learner_count: 4200, review_count: 550,
      topics: ['Face Detection & Recognition','Pose Estimation (MediaPipe)','Action Recognition','Medical Imaging','OCR & Document AI','Video Analytics','Edge Deployment','OpenCV Projects'],
    },
    {
      title: 'Speech & Audio Deep Learning',
      subtitle: 'Teach machines to understand sound',
      description: 'Audio processing with deep learning: speech recognition with Whisper, speaker verification, music generation, and audio classification.',
      duration: '9 weeks', mode: 'Online', rating: 4.6, learner_count: 1900, review_count: 240,
      topics: ['Audio Signal Processing','MFCCs & Spectrograms','CNN for Audio','RNN for ASR','Whisper Fine-tuning','Speaker Verification','Music Generation','Deployment'],
    },
    {
      title: 'Diffusion Models & Image Generation',
      subtitle: 'State-of-the-art generative AI',
      description: 'Complete diffusion models course: DDPM, DDIM, Stable Diffusion, ControlNet, LoRA fine-tuning, and building your own image generation pipeline.',
      duration: '12 weeks', mode: 'Online', rating: 4.9, learner_count: 5800, review_count: 770,
      topics: ['DDPM Theory','Score Matching','DDIM Sampling','Stable Diffusion Architecture','ControlNet','Dreambooth & LoRA','Inpainting & Outpainting','ComfyUI Workflows'],
    },
  ],

  data_analysis: [
    {
      title: 'Excel for Data Analysis',
      subtitle: 'Power analytics with Microsoft Excel',
      description: 'Master Excel for data analysis: pivot tables, VLOOKUP, power query, power pivot, dynamic arrays, and building interactive dashboards.',
      duration: '5 weeks', mode: 'Online', rating: 4.4, learner_count: 8900, review_count: 1200,
      topics: ['Pivot Tables','VLOOKUP & INDEX-MATCH','Power Query','Power Pivot','Dynamic Arrays','Conditional Formatting','Dashboard Design','Macro Basics'],
    },
    {
      title: 'SQL for Analytics',
      subtitle: 'Query your data like a pro',
      description: 'SQL from basics to advanced analytics: window functions, CTEs, recursive queries, performance optimization, and working with BigQuery.',
      duration: '7 weeks', mode: 'Online', rating: 4.7, learner_count: 6700, review_count: 890,
      topics: ['SELECT & Joins','Aggregations','Window Functions','CTEs & Subqueries','Recursive Queries','Query Optimization','BigQuery','SQL for ML'],
    },
    {
      title: 'Statistics for Data Science',
      subtitle: 'The math behind data analysis',
      description: 'Probability theory, descriptive statistics, inferential statistics, hypothesis testing, regression, and Bayesian thinking for data science.',
      duration: '8 weeks', mode: 'Online', rating: 4.6, learner_count: 4500, review_count: 590,
      topics: ['Descriptive Statistics','Probability Distributions','Hypothesis Testing','Confidence Intervals','Linear Regression','Bayesian Statistics','A/B Testing','Statistical Power'],
    },
    {
      title: 'R for Statistical Analysis',
      subtitle: 'Statistical computing with R',
      description: 'Learn R for data analysis: tidyverse, dplyr, ggplot2, statistical modeling, and reproducible research with R Markdown.',
      duration: '8 weeks', mode: 'Online', rating: 4.5, learner_count: 2800, review_count: 360,
      topics: ['R Basics','tidyverse & dplyr','ggplot2','Data Cleaning','Linear Models','Logistic Regression','R Markdown','Shiny Apps'],
    },
    {
      title: 'Business Intelligence with Power BI',
      subtitle: 'Transform data into business insights',
      description: 'Complete Power BI course: data modeling, DAX, report design, deployment to Power BI Service, and best practices for BI development.',
      duration: '9 weeks', mode: 'Online', rating: 4.7, learner_count: 5300, review_count: 700,
      topics: ['Power Query & ETL','Data Modeling','DAX Fundamentals','Advanced DAX','Report Design','Row-Level Security','Power BI Service','Paginated Reports'],
    },
    {
      title: 'Exploratory Data Analysis',
      subtitle: 'Uncover patterns and insights in data',
      description: 'Systematic EDA techniques: univariate analysis, bivariate analysis, multivariate analysis, handling outliers, and telling stories with data.',
      duration: '6 weeks', mode: 'Online', rating: 4.5, learner_count: 3900, review_count: 510,
      topics: ['Univariate Analysis','Bivariate & Multivariate','Correlation Analysis','Outlier Detection','Feature Distributions','Storytelling with Data','Automated EDA','Case Studies'],
    },
    {
      title: 'Predictive Analytics',
      subtitle: 'Forecast business outcomes with data',
      description: 'Predictive modeling for business: churn prediction, demand forecasting, customer lifetime value, and credit risk scoring.',
      duration: '9 weeks', mode: 'Online', rating: 4.6, learner_count: 3100, review_count: 400,
      topics: ['Churn Prediction','Demand Forecasting','Customer Segmentation','CLV Modeling','Credit Scoring','Marketing Mix Modeling','Attribution Modeling','Production Deployment'],
    },
    {
      title: 'Data Wrangling with Pandas',
      subtitle: 'Clean and transform messy data',
      description: 'Advanced Pandas: multi-index, merging strategies, time series with pandas, string operations, and processing large datasets efficiently.',
      duration: '6 weeks', mode: 'Online', rating: 4.6, learner_count: 4700, review_count: 610,
      topics: ['DataFrame Operations','Multi-Index','Merging & Joining','Time Series','String Operations','Categorical Data','Memory Optimization','Dask for Big Data'],
    },
    {
      title: 'Apache Spark for Big Data Analytics',
      subtitle: 'Process billions of rows at scale',
      description: 'Spark fundamentals to advanced: RDDs, DataFrames, Spark SQL, MLlib, Structured Streaming, and Delta Lake for big data analytics.',
      duration: '12 weeks', mode: 'Online', rating: 4.7, learner_count: 2600, review_count: 330,
      topics: ['Spark Architecture','RDDs & DataFrames','Spark SQL','MLlib','Structured Streaming','Delta Lake','Performance Tuning','EMR & Databricks'],
    },
    {
      title: 'Data Analytics Career Bootcamp',
      subtitle: 'Land your first data analytics job',
      description: 'End-to-end career program: SQL, Python, Excel, Power BI, portfolio projects, resume building, and mock interview preparation.',
      duration: '16 weeks', mode: 'Online', rating: 4.8, learner_count: 7200, review_count: 950,
      topics: ['SQL Fundamentals','Python Pandas','Excel & Power BI','Statistics Basics','Portfolio Projects','GitHub Profile','Resume & LinkedIn','Mock Interviews'],
    },
  ],

  data_viz: [
    {
      title: 'Tableau Desktop Mastery',
      subtitle: 'Create stunning data visualizations',
      description: 'Complete Tableau course: connecting to data sources, building charts, LOD expressions, dashboard design, and publishing to Tableau Server.',
      duration: '8 weeks', mode: 'Online', rating: 4.7, learner_count: 4800, review_count: 630,
      topics: ['Tableau Interface','Calculated Fields','LOD Expressions','Parameters','Dashboard Design','Storytelling','Tableau Server','Tableau Prep'],
    },
    {
      title: 'Data Visualization with Python',
      subtitle: 'Matplotlib, Seaborn, Plotly & more',
      description: 'Master Python visualization: Matplotlib customization, Seaborn statistical plots, Plotly interactive charts, and Dash dashboards.',
      duration: '7 weeks', mode: 'Online', rating: 4.6, learner_count: 5100, review_count: 670,
      topics: ['Matplotlib Anatomy','Seaborn Plots','Plotly Express','Interactive Charts','Dash Basics','Altair','Geographic Maps','Animation'],
    },
    {
      title: 'D3.js Data-Driven Visualizations',
      subtitle: 'Build custom interactive charts for the web',
      description: 'D3.js from fundamentals to advanced: scales, axes, transitions, maps, force layouts, and building a full visualization dashboard.',
      duration: '10 weeks', mode: 'Online', rating: 4.6, learner_count: 1800, review_count: 230,
      topics: ['SVG Basics','D3 Selections','Scales & Axes','Transitions','Force Layout','Geographic Maps','Brush & Zoom','Dashboard Project'],
    },
    {
      title: 'Looker Studio (Data Studio)',
      subtitle: 'Free BI tool for modern reporting',
      description: 'Build professional reports with Looker Studio: blending data sources, calculated fields, interactive controls, and embedding reports.',
      duration: '4 weeks', mode: 'Online', rating: 4.4, learner_count: 3200, review_count: 420,
      topics: ['Data Sources','Chart Types','Calculated Fields','Blending','Date Controls','Conditional Formatting','Report Templates','Embedding & Sharing'],
    },
    {
      title: 'Storytelling with Data',
      subtitle: 'Communicate insights that drive decisions',
      description: 'The art and science of data storytelling: choosing the right chart, decluttering visuals, directing attention, and presenting to executives.',
      duration: '5 weeks', mode: 'Online', rating: 4.7, learner_count: 4100, review_count: 530,
      topics: ['Choosing Charts','Gestalt Principles','Removing Clutter','Directing Attention','Color Theory','Annotations','Executive Presentations','Case Studies'],
    },
    {
      title: 'Geospatial Data Visualization',
      subtitle: 'Maps and location intelligence',
      description: 'Geospatial analytics: GeoPandas, Folium, Kepler.gl, PostGIS, and building interactive maps for business intelligence.',
      duration: '7 weeks', mode: 'Online', rating: 4.5, learner_count: 1600, review_count: 200,
      topics: ['Coordinate Systems','GeoPandas','Folium Maps','Choropleth Maps','Kepler.gl','PostGIS','Spatial Joins','Location Analytics'],
    },
    {
      title: 'Analytics Engineering with dbt',
      subtitle: 'Transform data in your warehouse',
      description: 'dbt (data build tool) complete course: models, tests, documentation, incremental models, and building a modern data stack with Snowflake.',
      duration: '8 weeks', mode: 'Online', rating: 4.8, learner_count: 2100, review_count: 270,
      topics: ['dbt Fundamentals','Models & References','Tests & Documentation','Sources','Incremental Models','Snapshots','Packages','Snowflake Integration'],
    },
    {
      title: 'Dashboard Design Principles',
      subtitle: 'Design dashboards people actually use',
      description: 'UX for data: information hierarchy, dashboard layout, choosing KPIs, drill-down design, and testing dashboards with real users.',
      duration: '5 weeks', mode: 'Online', rating: 4.6, learner_count: 2700, review_count: 350,
      topics: ['Information Hierarchy','KPI Selection','Layout Patterns','Color & Typography','Drill-down Design','Mobile Dashboards','User Testing','Best Practices'],
    },
    {
      title: 'Real-time Dashboards with Grafana',
      subtitle: 'Visualize live metrics and logs',
      description: 'Build real-time monitoring dashboards with Grafana: Prometheus integration, InfluxDB, alerting, and creating custom panels.',
      duration: '6 weeks', mode: 'Online', rating: 4.5, learner_count: 1900, review_count: 240,
      topics: ['Grafana Setup','Prometheus Metrics','InfluxDB','Dashboard Variables','Alerting','Custom Plugins','Loki for Logs','Kubernetes Monitoring'],
    },
    {
      title: 'Visual Analytics for Business',
      subtitle: 'Applied analytics for business decisions',
      description: 'Applied visual analytics: sales dashboards, marketing attribution, supply chain monitoring, financial reporting, and HR analytics.',
      duration: '8 weeks', mode: 'Online', rating: 4.7, learner_count: 3400, review_count: 440,
      topics: ['Sales Analytics','Marketing Attribution','Supply Chain KPIs','Financial Reporting','HR Analytics','Customer Analytics','Cohort Analysis','Executive Dashboards'],
    },
  ],

  cloud: [
    {
      title: 'AWS Solutions Architect Associate',
      subtitle: 'Prepare for SAA-C03 certification',
      description: 'Complete AWS SAA prep: EC2, S3, RDS, VPC, IAM, CloudFront, Lambda, and hands-on labs for the Solutions Architect Associate exam.',
      duration: '12 weeks', mode: 'Online', rating: 4.8, learner_count: 7600, review_count: 1010,
      topics: ['IAM & Security','EC2 & Auto Scaling','S3 & CloudFront','VPC Networking','RDS & Aurora','Lambda & API Gateway','CloudWatch','Exam Practice'],
    },
    {
      title: 'Google Cloud Platform Fundamentals',
      subtitle: 'Build on Google\'s cloud infrastructure',
      description: 'GCP from scratch: Compute Engine, GKE, Cloud Storage, BigQuery, Cloud SQL, IAM, and preparing for the Associate Cloud Engineer exam.',
      duration: '10 weeks', mode: 'Online', rating: 4.6, learner_count: 3800, review_count: 490,
      topics: ['GCP Compute','GKE','Cloud Storage','BigQuery','Cloud SQL','IAM','VPC','Cloud Functions'],
    },
    {
      title: 'Microsoft Azure Fundamentals AZ-900',
      subtitle: 'Start your Azure journey',
      description: 'Azure AZ-900 preparation: cloud concepts, Azure services, pricing, SLAs, and Azure governance for the fundamentals certification.',
      duration: '6 weeks', mode: 'Online', rating: 4.5, learner_count: 5200, review_count: 680,
      topics: ['Cloud Concepts','Azure Architecture','Compute Services','Networking','Storage','Databases','Security','Pricing & Support'],
    },
    {
      title: 'Serverless Architecture',
      subtitle: 'Build apps without managing servers',
      description: 'Serverless from first principles: AWS Lambda, API Gateway, DynamoDB, S3 events, Step Functions, and building event-driven architectures.',
      duration: '8 weeks', mode: 'Online', rating: 4.7, learner_count: 3100, review_count: 400,
      topics: ['Serverless Concepts','AWS Lambda','API Gateway','DynamoDB','S3 Triggers','Step Functions','SAM & Serverless Framework','Event-Driven Patterns'],
    },
    {
      title: 'Cloud Security & Compliance',
      subtitle: 'Secure your cloud infrastructure',
      description: 'Cloud security best practices: identity management, network security, data encryption, compliance frameworks, and security monitoring.',
      duration: '9 weeks', mode: 'Online', rating: 4.7, learner_count: 2700, review_count: 350,
      topics: ['Identity & Access','Network Security','Data Encryption','KMS & HSM','Compliance (SOC2/ISO)','Security Hub','GuardDuty','Incident Response'],
    },
    {
      title: 'Multi-Cloud Architecture',
      subtitle: 'Design for cloud vendor independence',
      description: 'Multi-cloud strategy: workload placement, Terraform for multi-cloud IaC, unified monitoring, and disaster recovery across clouds.',
      duration: '10 weeks', mode: 'Online', rating: 4.5, learner_count: 1900, review_count: 240,
      topics: ['Multi-Cloud Strategy','Terraform','Cross-Cloud Networking','Unified Monitoring','Disaster Recovery','Cost Optimization','Vendor Lock-in','Architecture Patterns'],
    },
    {
      title: 'Infrastructure as Code with Terraform',
      subtitle: 'Automate cloud infrastructure provisioning',
      description: 'Terraform from beginner to advanced: HCL, state management, modules, workspaces, CI/CD integration, and Terragrunt.',
      duration: '8 weeks', mode: 'Online', rating: 4.8, learner_count: 4300, review_count: 560,
      topics: ['HCL Syntax','Providers & Resources','State Management','Modules','Workspaces','Remote State','CI/CD Integration','Terragrunt'],
    },
    {
      title: 'Cloud Cost Optimization',
      subtitle: 'Cut cloud bills without cutting performance',
      description: 'Cloud FinOps: right-sizing, reserved instances, spot instances, storage tiering, waste elimination, and building a cost-conscious culture.',
      duration: '5 weeks', mode: 'Online', rating: 4.6, learner_count: 2100, review_count: 270,
      topics: ['Cloud Pricing Models','Reserved Instances','Spot & Preemptible','Right-sizing','Storage Tiering','Tagging Strategy','FinOps Framework','Cost Dashboards'],
    },
    {
      title: 'Cloud Data Engineering',
      subtitle: 'Build data pipelines on the cloud',
      description: 'End-to-end cloud data engineering: data lakes on S3, Glue ETL, Redshift, Databricks, Snowflake, and real-time streaming with Kinesis.',
      duration: '12 weeks', mode: 'Online', rating: 4.7, learner_count: 3500, review_count: 450,
      topics: ['Data Lake Architecture','AWS Glue','Redshift','Databricks','Snowflake','Kinesis Streaming','Apache Airflow','dbt on Cloud'],
    },
    {
      title: 'Cloud Migration Strategies',
      subtitle: 'Move on-premise apps to the cloud',
      description: 'Cloud migration: 6Rs strategy, assessment tools, lift-and-shift, re-platforming, re-architecting, and post-migration optimization.',
      duration: '8 weeks', mode: 'Online', rating: 4.5, learner_count: 2300, review_count: 290,
      topics: ['Migration Assessment','6Rs Strategy','Discovery Tools','Lift-and-Shift','Re-platforming','Database Migration','Cutover Planning','Post-Migration'],
    },
  ],

  devops: [
    {
      title: 'Docker Complete Course',
      subtitle: 'Containerize everything',
      description: 'Docker from installation to advanced: images, containers, volumes, networking, Docker Compose, multi-stage builds, and security best practices.',
      duration: '7 weeks', mode: 'Online', rating: 4.8, learner_count: 8200, review_count: 1090,
      topics: ['Docker Architecture','Images & Containers','Volumes & Networks','Docker Compose','Multi-stage Builds','Docker Hub','Security','Docker Swarm'],
    },
    {
      title: 'Kubernetes Production Operations',
      subtitle: 'Orchestrate containers at scale',
      description: 'Kubernetes from basics to production: pods, deployments, services, ingress, RBAC, Helm, monitoring, and managing stateful workloads.',
      duration: '12 weeks', mode: 'Online', rating: 4.8, learner_count: 5700, review_count: 750,
      topics: ['K8s Architecture','Pods & Deployments','Services & Ingress','ConfigMaps & Secrets','RBAC','Helm Charts','Horizontal Pod Autoscaler','StatefulSets'],
    },
    {
      title: 'CI/CD with GitHub Actions',
      subtitle: 'Automate your software delivery pipeline',
      description: 'Build complete CI/CD pipelines with GitHub Actions: workflow syntax, matrix builds, reusable workflows, environments, and deployment strategies.',
      duration: '7 weeks', mode: 'Online', rating: 4.7, learner_count: 6100, review_count: 810,
      topics: ['Workflow Syntax','Triggers & Events','Jobs & Steps','Matrix Builds','Reusable Workflows','Environments','Deployment Strategies','Self-hosted Runners'],
    },
    {
      title: 'GitOps with ArgoCD & Flux',
      subtitle: 'Declarative continuous delivery',
      description: 'GitOps principles, ArgoCD for application delivery, Flux for cluster management, multi-cluster deployment, and progressive delivery with Argo Rollouts.',
      duration: '9 weeks', mode: 'Online', rating: 4.7, learner_count: 2400, review_count: 310,
      topics: ['GitOps Principles','ArgoCD Setup','Application Sync','Flux CD','Multi-Cluster','Secrets Management','Argo Rollouts','Canary Deployments'],
    },
    {
      title: 'Observability: Monitoring & Alerting',
      subtitle: 'See inside your production systems',
      description: 'Full observability stack: Prometheus metrics, Grafana dashboards, distributed tracing with Jaeger, centralized logging with ELK, and alerting.',
      duration: '9 weeks', mode: 'Online', rating: 4.6, learner_count: 3200, review_count: 420,
      topics: ['Prometheus Setup','PromQL','Grafana Dashboards','Alertmanager','Distributed Tracing (Jaeger)','ELK Stack','Loki','SLO & Error Budgets'],
    },
    {
      title: 'DevSecOps — Security in DevOps',
      subtitle: 'Shift security left in your pipeline',
      description: 'DevSecOps practices: SAST, DAST, dependency scanning, container scanning, secrets detection, and integrating security into CI/CD.',
      duration: '10 weeks', mode: 'Online', rating: 4.7, learner_count: 2900, review_count: 370,
      topics: ['SAST (SonarQube)','DAST (OWASP ZAP)','Dependency Scanning','Container Scanning (Trivy)','Secrets Detection','SBOM','Policy as Code (OPA)','Compliance Automation'],
    },
    {
      title: 'Linux Administration for DevOps',
      subtitle: 'Master Linux for DevOps & SRE roles',
      description: 'Linux fundamentals to advanced: file system, process management, networking, shell scripting, systemd, cgroups, and kernel tuning.',
      duration: '8 weeks', mode: 'Online', rating: 4.6, learner_count: 4100, review_count: 530,
      topics: ['File System','User & Permissions','Process Management','Networking','Shell Scripting (Bash)','systemd','Cgroups & Namespaces','Kernel Tuning'],
    },
    {
      title: 'Ansible for Automation',
      subtitle: 'Infrastructure automation made simple',
      description: 'Ansible from basics to advanced: playbooks, roles, inventories, Ansible Vault, AWX/Tower, and automating cloud and on-premise infrastructure.',
      duration: '7 weeks', mode: 'Online', rating: 4.5, learner_count: 3400, review_count: 440,
      topics: ['Inventory & Ad-hoc','Playbooks','Roles & Collections','Variables & Templates','Ansible Vault','Error Handling','AWX/Tower','Cloud Modules'],
    },
    {
      title: 'Site Reliability Engineering (SRE)',
      subtitle: 'Keep production systems reliable',
      description: 'SRE principles: SLOs, error budgets, incident management, chaos engineering, capacity planning, and on-call best practices.',
      duration: '10 weeks', mode: 'Online', rating: 4.8, learner_count: 2700, review_count: 350,
      topics: ['SLO & SLA Design','Error Budgets','Toil Reduction','Incident Management','Postmortems','Chaos Engineering','Capacity Planning','On-call Practices'],
    },
    {
      title: 'Platform Engineering',
      subtitle: 'Build internal developer platforms',
      description: 'Platform engineering: IDP design with Backstage, golden paths, self-service infrastructure, developer experience, and internal tooling.',
      duration: '10 weeks', mode: 'Online', rating: 4.7, learner_count: 1800, review_count: 230,
      topics: ['IDP Concepts','Backstage Setup','Software Catalog','Templates & Golden Paths','Self-Service APIs','Developer Portal','DORA Metrics','Team Topologies'],
    },
  ],

  ethical_hacking: [
    {
      title: 'Ethical Hacking Fundamentals',
      subtitle: 'Start your cybersecurity career right',
      description: 'Introduction to ethical hacking: penetration testing methodology, legal framework, reconnaissance, scanning, and writing professional reports.',
      duration: '8 weeks', mode: 'Online', rating: 4.7, learner_count: 5900, review_count: 780,
      topics: ['Hacking Methodology','Legal & Ethical Framework','Passive Reconnaissance','Active Scanning','Vulnerability Assessment','Exploitation Basics','Report Writing','CEH Prep'],
    },
    {
      title: 'Web Application Penetration Testing',
      subtitle: 'Find and exploit web vulnerabilities',
      description: 'Web pentesting: OWASP Top 10, SQL injection, XSS, IDOR, SSRF, API testing, Burp Suite mastery, and writing PoC exploits.',
      duration: '10 weeks', mode: 'Online', rating: 4.8, learner_count: 4600, review_count: 610,
      topics: ['Burp Suite Mastery','SQL Injection','XSS & CSRF','IDOR & SSRF','File Upload Attacks','API Security Testing','Authentication Bypass','Bug Bounty Reports'],
    },
    {
      title: 'Network Penetration Testing',
      subtitle: 'Hack networks like a professional',
      description: 'Network pentesting: Nmap, Metasploit, ARP spoofing, password attacks, Active Directory attacks, and pivoting techniques.',
      duration: '10 weeks', mode: 'Online', rating: 4.7, learner_count: 3900, review_count: 510,
      topics: ['Nmap & Recon','Metasploit Framework','Password Attacks','ARP & MitM','Active Directory','Kerberoasting','Pass-the-Hash','Pivoting & Tunneling'],
    },
    {
      title: 'Active Directory Attacks & Defense',
      subtitle: 'Master enterprise environment hacking',
      description: 'Complete Active Directory security course: enumeration, Kerberoasting, DCSync, Golden Ticket, BloodHound, and defensive hardening.',
      duration: '12 weeks', mode: 'Online', rating: 4.8, learner_count: 2800, review_count: 360,
      topics: ['AD Enumeration','BloodHound','Kerberoasting','AS-REP Roasting','DCSync','Golden & Silver Tickets','Forest Attacks','Defensive Hardening'],
    },
    {
      title: 'Malware Analysis & Reverse Engineering',
      subtitle: 'Understand how malware works',
      description: 'Static and dynamic malware analysis: PE file format, IDA Pro, Ghidra, sandbox analysis, and writing YARA rules for detection.',
      duration: '12 weeks', mode: 'Online', rating: 4.7, learner_count: 2100, review_count: 270,
      topics: ['PE File Format','Static Analysis','Dynamic Analysis','IDA Pro Basics','Ghidra','Sandbox Analysis','YARA Rules','Anti-Analysis Techniques'],
    },
    {
      title: 'Bug Bounty Hunting Masterclass',
      subtitle: 'Get paid to find security vulnerabilities',
      description: 'Real-world bug bounty: choosing programs, recon automation, IDOR hunting, subdomain enumeration, and writing effective reports.',
      duration: '9 weeks', mode: 'Online', rating: 4.8, learner_count: 6200, review_count: 820,
      topics: ['Platform Selection','Recon Automation','Subdomain Enumeration','IDOR Hunting','Parameter Pollution','Race Conditions','Report Writing','Earning Strategy'],
    },
    {
      title: 'Mobile Application Penetration Testing',
      subtitle: 'Hack Android and iOS apps',
      description: 'Mobile security testing: APK reverse engineering, frida for dynamic analysis, iOS security, certificate pinning bypass, and OWASP MASVS.',
      duration: '9 weeks', mode: 'Online', rating: 4.6, learner_count: 2400, review_count: 310,
      topics: ['Android Architecture','APK Reverse Engineering','Frida Framework','SSL Pinning Bypass','iOS Jailbreak Analysis','OWASP MASVS','Dynamic Analysis','Report Writing'],
    },
    {
      title: 'Exploit Development & Binary Exploitation',
      subtitle: 'Write your own exploits',
      description: 'Buffer overflows, format string vulnerabilities, heap exploitation, ROP chains, shellcoding, and bypassing modern protections (ASLR, NX, PIE).',
      duration: '14 weeks', mode: 'Online', rating: 4.8, learner_count: 1600, review_count: 210,
      topics: ['x86/x64 Assembly','Stack Overflows','Format String Bugs','Heap Exploitation','ROP Chains','ASLR Bypass','Shellcoding','Kernel Exploitation Intro'],
    },
    {
      title: 'Red Teaming Operations',
      subtitle: 'Advanced adversary simulation',
      description: 'Red team operations: C2 frameworks, phishing campaigns, lateral movement, persistence, data exfiltration, and MITRE ATT&CK mapping.',
      duration: '14 weeks', mode: 'Online', rating: 4.9, learner_count: 1900, review_count: 250,
      topics: ['Red Team Methodology','C2 Frameworks (Cobalt Strike)','Phishing Campaigns','Initial Access','Lateral Movement','Persistence','Data Exfiltration','MITRE ATT&CK'],
    },
    {
      title: 'OSCP Preparation Bootcamp',
      subtitle: 'Crack the most respected pen test cert',
      description: 'Intense OSCP preparation: HTB & VulnHub machines, buffer overflow, privilege escalation, Active Directory, and exam strategy.',
      duration: '16 weeks', mode: 'Online', rating: 4.9, learner_count: 3100, review_count: 410,
      topics: ['OSCP Methodology','Buffer Overflow (Windows/Linux)','PrivEsc Linux','PrivEsc Windows','AD Attacks','HTB Machines','VulnHub Practice','Exam Strategy'],
    },
  ],

  network_security: [
    {
      title: 'CompTIA Security+ Certification Prep',
      subtitle: 'Earn the most popular entry-level security cert',
      description: 'Complete Security+ SY0-701 preparation: threats, attacks, cryptography, identity management, network security, and risk management.',
      duration: '10 weeks', mode: 'Online', rating: 4.7, learner_count: 6800, review_count: 900,
      topics: ['Threat Landscape','Attack Types','Cryptography','Identity & Access','Network Security Controls','Wireless Security','Risk Management','Exam Practice'],
    },
    {
      title: 'Cisco CCNA Networking Fundamentals',
      subtitle: 'Build a strong networking foundation',
      description: 'CCNA 200-301 prep: networking fundamentals, switching, routing, IPv6, WAN, security, and automation for the CCNA certification.',
      duration: '14 weeks', mode: 'Online', rating: 4.6, learner_count: 5200, review_count: 680,
      topics: ['OSI Model','IP Addressing & Subnetting','VLANs & Trunking','OSPF & EIGRP','ACLs','NAT','VPNs','Network Automation'],
    },
    {
      title: 'Firewall Administration & Management',
      subtitle: 'Protect your network perimeter',
      description: 'Firewall fundamentals: stateful inspection, rule management, Palo Alto NGFW, Cisco ASA/FTD, and zero-trust network access.',
      duration: '8 weeks', mode: 'Online', rating: 4.5, learner_count: 2300, review_count: 290,
      topics: ['Firewall Concepts','Stateful Inspection','Rule Design','Palo Alto NGFW','Cisco FTD','Zone-Based Firewall','Zero Trust','SSL Inspection'],
    },
    {
      title: 'Intrusion Detection & Prevention Systems',
      subtitle: 'Detect and stop attacks in real-time',
      description: 'IDS/IPS from fundamentals: Snort, Suricata, YARA rules, alert tuning, and integrating with SIEM for automated response.',
      duration: '8 weeks', mode: 'Online', rating: 4.6, learner_count: 1900, review_count: 240,
      topics: ['IDS vs IPS','Snort Rules','Suricata','YARA Signatures','Alert Tuning','False Positive Management','SIEM Integration','Network Forensics'],
    },
    {
      title: 'VPN & Secure Remote Access',
      subtitle: 'Connect securely from anywhere',
      description: 'VPN technologies: IPSec, SSL VPN, WireGuard, zero-trust network access, split tunneling, and securing remote workforce.',
      duration: '6 weeks', mode: 'Online', rating: 4.4, learner_count: 2700, review_count: 340,
      topics: ['IPSec Fundamentals','SSL/TLS VPN','WireGuard','OpenVPN','Zero Trust Network Access','Split Tunneling','Multi-factor Authentication','VPN Security Auditing'],
    },
    {
      title: 'SIEM & Security Operations Center',
      subtitle: 'Monitor and respond to security events',
      description: 'SOC operations with SIEM: log aggregation, correlation rules, Splunk SIEM, Microsoft Sentinel, incident response playbooks, and threat hunting.',
      duration: '10 weeks', mode: 'Online', rating: 4.7, learner_count: 3100, review_count: 400,
      topics: ['SIEM Architecture','Log Management','Splunk Fundamentals','Microsoft Sentinel','Correlation Rules','Incident Response','Threat Hunting','SOAR Automation'],
    },
    {
      title: 'Digital Forensics & Incident Response',
      subtitle: 'Investigate and recover from breaches',
      description: 'DFIR: disk forensics, memory analysis, network forensics, timeline analysis, Autopsy, Volatility, and building incident response plans.',
      duration: '12 weeks', mode: 'Online', rating: 4.7, learner_count: 2200, review_count: 280,
      topics: ['Forensic Methodology','Disk Imaging','Memory Analysis (Volatility)','Network Forensics','Timeline Analysis','Autopsy & FTK','Log Analysis','IR Plan Development'],
    },
    {
      title: 'Wireless Network Security',
      subtitle: 'Secure and audit Wi-Fi networks',
      description: 'Wireless security: WPA2/WPA3, evil twin attacks, deauthentication, rogue AP detection, wireless pentesting with Aircrack-ng, and enterprise WLAN security.',
      duration: '7 weeks', mode: 'Online', rating: 4.5, learner_count: 2400, review_count: 310,
      topics: ['802.11 Protocols','WPA2 & WPA3','Evil Twin Attacks','Deauth Attacks','Aircrack-ng','Rogue AP Detection','Enterprise WLAN','Wireless IDS'],
    },
    {
      title: 'Zero Trust Architecture',
      subtitle: 'Never trust, always verify',
      description: 'Zero trust network architecture: identity-centric security, micro-segmentation, continuous verification, and implementing ZTA with modern tools.',
      duration: '8 weeks', mode: 'Online', rating: 4.7, learner_count: 1800, review_count: 230,
      topics: ['Zero Trust Principles','Identity-Centric Security','Device Trust','Micro-segmentation','SASE','ZTNA Implementation','Cloudflare Access','BeyondCorp'],
    },
    {
      title: 'Cloud Security Architecture',
      subtitle: 'Secure cloud environments end-to-end',
      description: 'Cloud security: shared responsibility model, IAM design, network security groups, data encryption, compliance automation, and CSPM tools.',
      duration: '10 weeks', mode: 'Online', rating: 4.7, learner_count: 2600, review_count: 330,
      topics: ['Shared Responsibility','IAM Design Patterns','Network Security Groups','Data Encryption','Key Management','Compliance Automation','CSPM Tools','Incident Response in Cloud'],
    },
  ],

  // COMPETITIVE EXAM ──────────────────────────────────────────────────────────

  upsc_prelims: [
    { title: 'UPSC Prelims — General Studies Paper 1', subtitle: 'History, Geography, Polity & Economy', description: 'Comprehensive GS Paper 1 preparation covering Indian History, World Geography, Indian Polity, Economy, and Environment for UPSC Prelims.', duration: '6 months', mode: 'Online', rating: 4.7, learner_count: 8900, review_count: 1180 },
    { title: 'UPSC CSAT — Paper 2 Mastery', subtitle: 'Crack the qualifying paper with confidence', description: 'Complete CSAT preparation: Quantitative Aptitude, Logical Reasoning, Reading Comprehension, and Decision Making for UPSC Prelims Paper 2.', duration: '3 months', mode: 'Online', rating: 4.5, learner_count: 6200, review_count: 820 },
    { title: 'UPSC Prelims Previous Year Analysis', subtitle: '25 years of questions analyzed', description: 'Systematic analysis of 25 years of UPSC Prelims questions with pattern analysis, topic weightage, and smart preparation strategy.', duration: '2 months', mode: 'Online', rating: 4.8, learner_count: 7400, review_count: 980 },
    { title: 'Indian Polity for UPSC', subtitle: 'Constitutional law made simple', description: 'Deep dive into Indian Polity: Constitution, Parliament, Judiciary, Federalism, Fundamental Rights, and governance for UPSC Prelims & Mains.', duration: '3 months', mode: 'Online', rating: 4.7, learner_count: 9100, review_count: 1200 },
    { title: 'Indian Economy for UPSC', subtitle: 'Economic concepts for IAS aspirants', description: 'Indian Economy for UPSC: national income, fiscal policy, monetary policy, banking, agriculture, industry, and current economic affairs.', duration: '3 months', mode: 'Online', rating: 4.6, learner_count: 7800, review_count: 1030 },
    { title: 'Modern Indian History for UPSC', subtitle: 'From 1757 to Independence', description: 'Modern Indian History: British colonialism, freedom struggle, social reform movements, and partition for UPSC Prelims and Mains.', duration: '2 months', mode: 'Online', rating: 4.6, learner_count: 8300, review_count: 1100 },
    { title: 'Geography for UPSC', subtitle: 'Physical and human geography mastery', description: 'Indian and World Geography: physical, human, economic geography, climatology, oceanography, and environmental geography for UPSC.', duration: '3 months', mode: 'Online', rating: 4.5, learner_count: 7100, review_count: 940 },
    { title: 'Environment & Ecology for UPSC', subtitle: 'One of the most scoring topics', description: 'Environment and Ecology: ecosystems, biodiversity, climate change, environmental laws, international conventions, and current affairs.', duration: '2 months', mode: 'Online', rating: 4.7, learner_count: 6500, review_count: 860 },
    { title: 'Current Affairs for UPSC Prelims', subtitle: 'Stay ahead with monthly updates', description: 'Monthly current affairs compilation: national, international, economy, science & technology, and environment for UPSC Prelims.', duration: '12 months', mode: 'Online', rating: 4.8, learner_count: 12000, review_count: 1590 },
    { title: 'UPSC Prelims Full Mock Series', subtitle: 'Test yourself with 50 full-length mocks', description: 'Complete mock test series with 50 full-length Prelims papers, detailed analysis, percentile ranking, and performance tracking.', duration: '6 months', mode: 'Online', rating: 4.8, learner_count: 11000, review_count: 1460 },
  ],

  upsc_mains: [
    { title: 'UPSC Mains GS Paper 1 — History & Society', subtitle: 'Indian Heritage, Culture & World History', description: 'GS Paper 1 deep dive: Art & Culture, Modern History, Post-independence India, World History, Geography, and Society.', duration: '4 months', mode: 'Online', rating: 4.7, learner_count: 5400, review_count: 710 },
    { title: 'UPSC Mains GS Paper 2 — Governance & IR', subtitle: 'Polity, Social Justice & International Relations', description: 'GS Paper 2 comprehensive: Indian Polity, Governance, Social Justice, International Relations, and contemporary global issues.', duration: '4 months', mode: 'Online', rating: 4.6, learner_count: 5100, review_count: 670 },
    { title: 'UPSC Mains GS Paper 3 — Economy & Science', subtitle: 'Economic Development, Technology & Disaster Management', description: 'GS Paper 3: Indian Economy, Agriculture, Infrastructure, Science & Technology, Environment, and Disaster Management.', duration: '4 months', mode: 'Online', rating: 4.6, learner_count: 4900, review_count: 650 },
    { title: 'UPSC Mains GS Paper 4 — Ethics', subtitle: 'Ethics, Integrity and Aptitude for Civil Services', description: 'Ethics, Integrity and Aptitude (Paper 4): theoretical frameworks, case studies, emotional intelligence, and moral dilemmas.', duration: '3 months', mode: 'Online', rating: 4.8, learner_count: 5700, review_count: 750 },
    { title: 'UPSC Essay Paper Masterclass', subtitle: 'Write essays that score 150+', description: 'Essay writing for UPSC Mains: topic selection, structure, introduction hooks, and practice with previous year essay topics.', duration: '2 months', mode: 'Online', rating: 4.7, learner_count: 6300, review_count: 830 },
    { title: 'Answer Writing for UPSC Mains', subtitle: 'The most critical skill for Mains success', description: 'Art of answer writing: structure, diagrams, intro-body-conclusion, time management, and evaluation-focused writing.', duration: '3 months', mode: 'Online', rating: 4.9, learner_count: 8100, review_count: 1070 },
    { title: 'Optional Subject — Public Administration', subtitle: 'High-scoring optional for Mains', description: 'Public Administration optional: administrative theory, Indian administration, comparative public policy, and public policy analysis.', duration: '6 months', mode: 'Online', rating: 4.6, learner_count: 3200, review_count: 420 },
    { title: 'Optional Subject — Sociology', subtitle: 'Score 300+ with strategic preparation', description: 'Sociology optional: sociological thinkers, society in India, and contemporary social issues with focus on answer writing.', duration: '6 months', mode: 'Online', rating: 4.5, learner_count: 2900, review_count: 380 },
    { title: 'UPSC Mains Full Test Series', subtitle: 'Complete Mains mock test program', description: 'Comprehensive Mains test series: GS 1-4, Essay, and optional subject tests with detailed evaluation and mentoring.', duration: '6 months', mode: 'Online', rating: 4.8, learner_count: 4600, review_count: 610 },
    { title: 'UPSC Interview (Personality Test) Prep', subtitle: 'Clear the final hurdle to IAS', description: 'IAS interview preparation: board dynamics, DAF-based questions, current affairs discussion, body language, and mock interviews.', duration: '1 month', mode: 'Online', rating: 4.9, learner_count: 2100, review_count: 280 },
  ],

  ssc_cgl: [
    { title: 'SSC CGL Complete Course', subtitle: 'Crack Tier 1 & Tier 2 in one go', description: 'All-in-one SSC CGL course covering Quantitative Aptitude, Reasoning, English, and General Awareness for Tier 1 and Tier 2.', duration: '6 months', mode: 'Online', rating: 4.7, learner_count: 14000, review_count: 1860 },
    { title: 'SSC CGL Quantitative Aptitude', subtitle: 'Score 45+ in Maths', description: 'Complete Maths for SSC CGL: arithmetic, algebra, geometry, trigonometry, and data interpretation with shortcut techniques.', duration: '3 months', mode: 'Online', rating: 4.6, learner_count: 11000, review_count: 1460 },
    { title: 'SSC CGL English Language', subtitle: 'Master English for SSC exams', description: 'English for SSC CGL: grammar, vocabulary, reading comprehension, cloze test, error spotting, and sentence improvement.', duration: '2 months', mode: 'Online', rating: 4.5, learner_count: 9400, review_count: 1250 },
    { title: 'SSC CGL Reasoning', subtitle: 'Logical reasoning tricks and shortcuts', description: 'Verbal and non-verbal reasoning for SSC CGL: series, analogies, coding-decoding, matrix, Venn diagrams, and spatial visualization.', duration: '2 months', mode: 'Online', rating: 4.6, learner_count: 10200, review_count: 1350 },
    { title: 'SSC CGL General Awareness', subtitle: 'Current affairs + static GK', description: 'General Knowledge for SSC CGL: Indian History, Geography, Polity, Economy, Science, and current affairs.', duration: '2 months', mode: 'Online', rating: 4.5, learner_count: 9800, review_count: 1300 },
    { title: 'SSC CGL Tier 2 — Statistics Paper', subtitle: 'For Junior Statistical Officer posts', description: 'Statistics paper for SSC CGL Tier 2: descriptive statistics, probability, index numbers, time series, and sampling theory.', duration: '2 months', mode: 'Online', rating: 4.4, learner_count: 4200, review_count: 560 },
    { title: 'SSC CGL Tier 2 — Finance & Economics', subtitle: 'For AAO & Finance-related posts', description: 'Finance & Economics for SSC CGL Tier 2: financial accounting, managerial economics, cost accounting, and auditing.', duration: '2 months', mode: 'Online', rating: 4.4, learner_count: 3700, review_count: 490 },
    { title: 'SSC CGL Mock Test Series', subtitle: '100 full-length practice papers', description: 'Complete SSC CGL mock series with 100 full-length papers, OMR-based practice, and detailed performance analytics.', duration: '3 months', mode: 'Online', rating: 4.7, learner_count: 16000, review_count: 2120 },
    { title: 'SSC CGL Previous Year Papers', subtitle: '10 years analyzed and solved', description: 'Detailed solution and analysis of 10 years of SSC CGL papers with topic-wise analysis and scoring patterns.', duration: '1 month', mode: 'Online', rating: 4.8, learner_count: 18000, review_count: 2390 },
    { title: 'SSC CGL Interview & Document Verification', subtitle: 'Final stage preparation', description: 'Post-Tier 2 guidance: document verification process, interview preparation (for applicable posts), and joining formalities.', duration: '2 weeks', mode: 'Online', rating: 4.5, learner_count: 3100, review_count: 410 },
  ],

  ssc_chsl: [
    { title: 'SSC CHSL Complete Preparation', subtitle: 'Tier 1, Tier 2 & Typing Test', description: 'All-in-one SSC CHSL preparation: Tier 1 CBT, Tier 2 descriptive paper, and skill test / typing test guidance.', duration: '4 months', mode: 'Online', rating: 4.6, learner_count: 9200, review_count: 1220 },
    { title: 'SSC CHSL Quantitative Aptitude', subtitle: 'Score maximum in Maths', description: 'Mathematics for SSC CHSL: percentages, profit & loss, simple & compound interest, time & work, and trigonometry.', duration: '2 months', mode: 'Online', rating: 4.5, learner_count: 7600, review_count: 1010 },
    { title: 'SSC CHSL English Language', subtitle: 'Crack English with smart tricks', description: 'English for CHSL: grammar, vocabulary, one-word substitution, idioms & phrases, and reading comprehension.', duration: '2 months', mode: 'Online', rating: 4.5, learner_count: 7100, review_count: 940 },
    { title: 'SSC CHSL Reasoning Ability', subtitle: 'Logic and intelligence boost', description: 'Reasoning for CHSL: coding-decoding, analogies, series, puzzles, blood relations, direction sense, and non-verbal reasoning.', duration: '2 months', mode: 'Online', rating: 4.4, learner_count: 6800, review_count: 900 },
    { title: 'SSC CHSL General Awareness', subtitle: 'GK + Current Affairs combo', description: 'GK for CHSL: History, Geography, Polity, Science & Technology, and monthly current affairs updates.', duration: '2 months', mode: 'Online', rating: 4.4, learner_count: 6500, review_count: 860 },
    { title: 'SSC CHSL Descriptive Paper', subtitle: 'Essay & Letter writing for Tier 2', description: 'Descriptive writing for CHSL Tier 2: essay topics, formal & informal letter formats, and practice with model answers.', duration: '1 month', mode: 'Online', rating: 4.6, learner_count: 5800, review_count: 770 },
    { title: 'SSC CHSL Typing Speed Booster', subtitle: 'Achieve 35 WPM with accuracy', description: 'Typing test preparation: touch typing technique, speed building exercises, accuracy improvement, and SSC exam simulation.', duration: '2 months', mode: 'Online', rating: 4.5, learner_count: 5100, review_count: 680 },
    { title: 'SSC CHSL Mock Test Series', subtitle: '75 topic-wise and full-length mocks', description: 'Complete mock series with 75 tests, Tier 1 and Tier 2 simulation, and detailed answer explanations.', duration: '3 months', mode: 'Online', rating: 4.7, learner_count: 10400, review_count: 1380 },
    { title: 'SSC CHSL Previous Year Papers', subtitle: 'Solve 8 years of papers', description: 'Year-wise solved papers with detailed explanations, topic analysis, and cutoff trends for SSC CHSL.', duration: '1 month', mode: 'Online', rating: 4.7, learner_count: 12000, review_count: 1590 },
    { title: 'SSC CHSL LDC/JSA Job Profile Guide', subtitle: 'What to expect after selection', description: 'Post-selection guidance: job profile overview, posting preferences, career growth, departmental exams, and workplace preparation.', duration: '1 week', mode: 'Online', rating: 4.3, learner_count: 2400, review_count: 320 },
  ],

  ibps: [
    { title: 'IBPS PO Complete Course', subtitle: 'Prelims + Mains + Interview', description: 'Complete IBPS PO preparation: Prelims (Reasoning, Quant, English), Mains (all sections + descriptive), and interview guidance.', duration: '5 months', mode: 'Online', rating: 4.7, learner_count: 11000, review_count: 1460 },
    { title: 'IBPS Clerk Complete Course', subtitle: 'Prelims and Mains all sections', description: 'IBPS Clerk preparation: Prelims (Reasoning, Quant, English) and Mains (all 5 sections) with topic-wise and full-length mocks.', duration: '4 months', mode: 'Online', rating: 4.6, learner_count: 9700, review_count: 1290 },
    { title: 'IBPS RRB Officer Scale 1', subtitle: 'Regional Rural Bank officer preparation', description: 'IBPS RRB OS-1 complete prep: Reasoning, Quantitative Aptitude, General Awareness, and Hindi Language for Prelims and Mains.', duration: '4 months', mode: 'Online', rating: 4.5, learner_count: 6800, review_count: 900 },
    { title: 'Banking Awareness for IBPS', subtitle: 'Essential for all banking exams', description: 'Banking Awareness: RBI functions, monetary policy, financial institutions, banking terms, and current banking news for IBPS exams.', duration: '2 months', mode: 'Online', rating: 4.6, learner_count: 8400, review_count: 1120 },
    { title: 'IBPS Quantitative Aptitude', subtitle: 'Score 45/50 in Quant section', description: 'Quant for banking exams: number system, DI, quadratic equations, approximation, inequality, and banking-specific aptitude.', duration: '2 months', mode: 'Online', rating: 4.6, learner_count: 9100, review_count: 1210 },
    { title: 'IBPS English Language', subtitle: 'Master English for banking exams', description: 'English for IBPS: reading comprehension, cloze test, parajumbles, error detection, and new pattern English questions.', duration: '2 months', mode: 'Online', rating: 4.5, learner_count: 7900, review_count: 1050 },
    { title: 'IBPS Reasoning Ability', subtitle: 'Crack reasoning with speed', description: 'Reasoning for IBPS: puzzles, seating arrangement, blood relations, syllogisms, machine input-output, and coded inequalities.', duration: '2 months', mode: 'Online', rating: 4.6, learner_count: 8700, review_count: 1150 },
    { title: 'IBPS Mains Descriptive Writing', subtitle: 'Letter & Essay for Mains', description: 'Descriptive paper for IBPS PO Mains: letter writing (formal/informal), essay writing, and precis writing with model answers.', duration: '1 month', mode: 'Online', rating: 4.5, learner_count: 5300, review_count: 700 },
    { title: 'IBPS Mock Test Series', subtitle: '120 practice tests across all IBPS exams', description: '120 full-length and topic-wise mocks for IBPS PO, Clerk, RRB with detailed analytics and percentile ranking.', duration: '3 months', mode: 'Online', rating: 4.8, learner_count: 17000, review_count: 2250 },
    { title: 'IBPS Interview Preparation', subtitle: 'Crack the final stage', description: 'IBPS PO interview: HR questions, banking knowledge, current affairs, panel interview techniques, and mock interview sessions.', duration: '3 weeks', mode: 'Online', rating: 4.7, learner_count: 4600, review_count: 610 },
  ],

  sbi: [
    { title: 'SBI PO Complete Course', subtitle: 'Prelims + Mains + GD & Interview', description: 'Complete SBI PO preparation: Prelims (3 sections), Mains (4 sections + descriptive), Group Discussion, and Interview.', duration: '5 months', mode: 'Online', rating: 4.8, learner_count: 14000, review_count: 1860 },
    { title: 'SBI Clerk Complete Course', subtitle: 'Junior Associate preparation', description: 'SBI Clerk Prelims and Mains: English, Reasoning, Quant, General/Financial Awareness, and Computer Aptitude.', duration: '4 months', mode: 'Online', rating: 4.6, learner_count: 11000, review_count: 1460 },
    { title: 'SBI PO Mains Special — Data Analysis', subtitle: 'Score high in the toughest section', description: 'Data Analysis & Interpretation for SBI PO Mains: advanced DI, caselets, tabular DI, and calculation shortcuts.', duration: '2 months', mode: 'Online', rating: 4.7, learner_count: 8200, review_count: 1090 },
    { title: 'SBI Quantitative Aptitude Mastery', subtitle: 'Full marks strategy for SBI exams', description: 'Quant for SBI PO & Clerk: all topics with shortcut formulas, SBI-specific question types, and timed practice sets.', duration: '2 months', mode: 'Online', rating: 4.7, learner_count: 9800, review_count: 1300 },
    { title: 'SBI English Language Pro', subtitle: 'New pattern English mastery', description: 'English for SBI: new pattern RC, word swap, coherent paragraph, column-based questions, and descriptive writing.', duration: '2 months', mode: 'Online', rating: 4.6, learner_count: 8600, review_count: 1140 },
    { title: 'SBI Reasoning Ability Pro', subtitle: 'High-level puzzles for SBI Mains', description: 'Advanced Reasoning for SBI: complex puzzles, input-output, critical reasoning, data sufficiency, and Mains-level questions.', duration: '2 months', mode: 'Online', rating: 4.7, learner_count: 9200, review_count: 1220 },
    { title: 'Financial Awareness for SBI', subtitle: 'Current banking & economy for SBI exams', description: 'Financial Awareness: RBI policies, banking sector, financial inclusion, government schemes, and current banking events.', duration: '2 months', mode: 'Online', rating: 4.5, learner_count: 7400, review_count: 980 },
    { title: 'SBI PO Group Discussion Guide', subtitle: 'Ace the GD round', description: 'Group Discussion prep for SBI PO: GD topics, speaking techniques, body language, leadership in group, and common banking GD topics.', duration: '3 weeks', mode: 'Online', rating: 4.6, learner_count: 4900, review_count: 650 },
    { title: 'SBI Mock Test Series', subtitle: '100 full-length SBI mocks', description: '100 full-length mocks for SBI PO and Clerk with detailed analysis, topic-wise performance tracking, and all-India rank.', duration: '3 months', mode: 'Online', rating: 4.8, learner_count: 18000, review_count: 2390 },
    { title: 'SBI Specialist Officer (SO) Preparation', subtitle: 'Professional knowledge for SO posts', description: 'SBI SO preparation: IT Officer, Law Officer, CA, Rajbhasha Adhikari — professional knowledge + reasoning & English.', duration: '3 months', mode: 'Online', rating: 4.5, learner_count: 4100, review_count: 540 },
  ],

  rrb_ntpc: [
    { title: 'RRB NTPC Complete Preparation', subtitle: 'CBT 1, CBT 2 & Skill Tests', description: 'Complete RRB NTPC prep: CBT 1 (General Awareness, Maths, Reasoning), CBT 2, and typing/skill test guidance.', duration: '4 months', mode: 'Online', rating: 4.7, learner_count: 18000, review_count: 2390 },
    { title: 'RRB NTPC Mathematics', subtitle: 'Score full marks in Maths', description: 'Maths for RRB NTPC: number system, HCF-LCM, percentages, ratio & proportion, simple interest, geometry, and mensuration.', duration: '2 months', mode: 'Online', rating: 4.6, learner_count: 14000, review_count: 1860 },
    { title: 'RRB NTPC General Intelligence & Reasoning', subtitle: 'Fast reasoning techniques', description: 'Reasoning for NTPC: analogies, coding-decoding, number series, direction sense, Venn diagrams, and statement-conclusion.', duration: '2 months', mode: 'Online', rating: 4.5, learner_count: 13000, review_count: 1720 },
    { title: 'RRB NTPC General Awareness', subtitle: 'GK for Railways exams', description: 'GK for NTPC: Indian Railways facts, History, Geography, Polity, Science, and railway-specific current affairs.', duration: '2 months', mode: 'Online', rating: 4.6, learner_count: 15000, review_count: 1990 },
    { title: 'Indian Railways Knowledge Bank', subtitle: 'Special focus for NTPC & Group D', description: 'Indian Railways complete knowledge: zones, types of trains, railway budget, major projects, and railway-related GK.', duration: '1 month', mode: 'Online', rating: 4.7, learner_count: 11000, review_count: 1460 },
    { title: 'RRB NTPC CBT 2 Preparation', subtitle: 'Stage 2 — advanced level', description: 'RRB NTPC CBT 2 for specific posts: Graduate level posts, Junior account assistant, and post-specific specialized content.', duration: '2 months', mode: 'Online', rating: 4.5, learner_count: 8200, review_count: 1090 },
    { title: 'RRB NTPC Computer Based Typing Test', subtitle: 'Speed and accuracy for JCA, JTA posts', description: 'Typing speed practice for NTPC: touch typing, 30 WPM target, accuracy techniques, and CBT typing simulation.', duration: '2 months', mode: 'Online', rating: 4.4, learner_count: 6700, review_count: 890 },
    { title: 'Science for Railway Exams', subtitle: 'Physics, Chemistry & Biology basics', description: 'Science fundamentals for RRB: Physics, Chemistry, and Life Science topics with special focus on railway-applicable science.', duration: '2 months', mode: 'Online', rating: 4.5, learner_count: 9800, review_count: 1300 },
    { title: 'RRB NTPC Mock Test Series', subtitle: '200 topic-wise and full-length tests', description: '200 tests for NTPC CBT 1 & CBT 2 with AI-powered performance analysis and personalized weak area reports.', duration: '4 months', mode: 'Online', rating: 4.8, learner_count: 22000, review_count: 2920 },
    { title: 'RRB NTPC Previous Year Papers', subtitle: '12 years of solved papers', description: 'Complete 12-year analysis of RRB NTPC papers with detailed solutions, topic distribution, and difficulty trends.', duration: '1 month', mode: 'Online', rating: 4.8, learner_count: 24000, review_count: 3180 },
  ],

  rrb_gd: [
    { title: 'RRB Group D Complete Course', subtitle: 'Full preparation in 3 months', description: 'Complete RRB Group D: Mathematics, Reasoning, General Science, and General Awareness for CBT, PET, and document verification.', duration: '3 months', mode: 'Online', rating: 4.6, learner_count: 22000, review_count: 2920 },
    { title: 'RRB Group D Mathematics', subtitle: 'Simplified maths for Group D', description: 'Basic mathematics for Group D: BODMAS, fractions, LCM-HCF, percentage, profit-loss, and simple geometry.', duration: '6 weeks', mode: 'Online', rating: 4.5, learner_count: 18000, review_count: 2390 },
    { title: 'RRB Group D General Science', subtitle: 'Physics, Chemistry & Biology for Group D', description: 'General Science for Group D: basics of Physics, Chemistry, and Biology with daily life applications and previous year questions.', duration: '6 weeks', mode: 'Online', rating: 4.5, learner_count: 17000, review_count: 2250 },
    { title: 'RRB Group D Reasoning', subtitle: 'Simple and effective reasoning prep', description: 'Reasoning for Group D: series, analogy, coding-decoding, mirror image, paper cutting, Venn diagrams, and calendar.', duration: '6 weeks', mode: 'Online', rating: 4.4, learner_count: 16000, review_count: 2120 },
    { title: 'RRB Group D General Awareness', subtitle: 'History, Geography & Railway GK', description: 'GK for Group D: Indian History, Geography, Constitution basics, railway awareness, and current affairs.', duration: '2 months', mode: 'Online', rating: 4.5, learner_count: 15000, review_count: 1990 },
    { title: 'Physical Efficiency Test (PET) Guide', subtitle: 'Clear the fitness test with ease', description: 'PET preparation: distance run, weight lift, and fitness training plan to clear the Group D Physical Efficiency Test.', duration: '1 month', mode: 'Online', rating: 4.6, learner_count: 9100, review_count: 1210 },
    { title: 'RRB Group D Science — NCERT Based', subtitle: 'NCERT-focused science revision', description: 'Science for Group D based on NCERT Class 6-10: key concepts, formulas, and 5000 MCQ practice questions.', duration: '6 weeks', mode: 'Online', rating: 4.5, learner_count: 13000, review_count: 1720 },
    { title: 'RRB Group D Crash Course', subtitle: '30 days to the exam', description: '30-day crash course: all 4 subjects, daily targets, daily tests, and last-minute revision for RRB Group D.', duration: '1 month', mode: 'Online', rating: 4.6, learner_count: 27000, review_count: 3580 },
    { title: 'RRB Group D Mock Test Series', subtitle: '150 full-length mock papers', description: '150 full-length Group D mocks with exam-like interface, detailed solutions, and performance comparison with other students.', duration: '3 months', mode: 'Online', rating: 4.7, learner_count: 31000, review_count: 4110 },
    { title: 'RRB Group D Previous Year Solved Papers', subtitle: '2018, 2019, 2022 fully solved', description: 'Year-wise solved papers for RRB Group D with answer analysis, topic weightage, and predicted exam patterns.', duration: '1 month', mode: 'Online', rating: 4.8, learner_count: 35000, review_count: 4640 },
  ],

  nda: [
    { title: 'NDA Complete Course — Maths & GAT', subtitle: 'Clear NDA with a structured plan', description: 'Complete NDA preparation: Mathematics (300 marks) and General Ability Test (600 marks) with previous year papers and mocks.', duration: '6 months', mode: 'Online', rating: 4.7, learner_count: 8700, review_count: 1150 },
    { title: 'NDA Mathematics Mastery', subtitle: 'Score 250+ in NDA Maths', description: 'NDA Mathematics: Algebra, Matrices, Trigonometry, Calculus, Statistics, and Vector Algebra with 1000+ practice problems.', duration: '3 months', mode: 'Online', rating: 4.7, learner_count: 7400, review_count: 980 },
    { title: 'NDA General Ability Test (GAT)', subtitle: 'Ace the 600-mark general ability paper', description: 'GAT for NDA: English, Physics, Chemistry, Biology, History, Geography, and Current Affairs with topic-wise study plan.', duration: '3 months', mode: 'Online', rating: 4.6, learner_count: 6900, review_count: 910 },
    { title: 'NDA English Language', subtitle: 'Spot the errors, ace comprehension', description: 'English for NDA GAT: grammar, vocabulary, spotting errors, reading comprehension, and sentence improvement.', duration: '2 months', mode: 'Online', rating: 4.5, learner_count: 6100, review_count: 810 },
    { title: 'NDA Physics & Chemistry', subtitle: 'Science fundamentals for defence', description: 'Physics and Chemistry for NDA: Class 11-12 level concepts, important formulas, and NDA-specific question patterns.', duration: '2 months', mode: 'Online', rating: 4.6, learner_count: 5800, review_count: 770 },
    { title: 'NDA SSB Interview Preparation', subtitle: 'Clear the Services Selection Board', description: 'SSB interview complete prep: officer like qualities (OLQs), GTO tasks, psychology tests, personal interview, and mock SSB.', duration: '2 months', mode: 'Online', rating: 4.8, learner_count: 4600, review_count: 610 },
    { title: 'NDA History & Geography', subtitle: 'GK sections of GAT', description: 'History, Geography, and Current Events for NDA: Indian and World History, Physical Geography, and recent developments.', duration: '2 months', mode: 'Online', rating: 4.4, learner_count: 5400, review_count: 720 },
    { title: 'NDA Biology & General Science', subtitle: 'Life sciences for the GAT paper', description: 'Biology and General Science for NDA: human body systems, plant biology, environmental science, and science applications in defence.', duration: '2 months', mode: 'Online', rating: 4.4, learner_count: 5100, review_count: 680 },
    { title: 'NDA Mock Test Series', subtitle: '80 full-length NDA papers', description: '80 full-length NDA mock papers with exam-pattern simulation, Maths + GAT sections, and detailed marking analysis.', duration: '4 months', mode: 'Online', rating: 4.7, learner_count: 9200, review_count: 1220 },
    { title: 'NDA Previous Year Papers (2015–2024)', subtitle: '10 years completely solved', description: 'All NDA previous year papers from 2015-2024, fully solved with explanations, topic analysis, and difficulty ratings.', duration: '2 months', mode: 'Online', rating: 4.8, learner_count: 11000, review_count: 1460 },
  ],

  cds: [
    { title: 'CDS Complete Preparation Course', subtitle: 'IMA, INA, AFA & OTA — all covered', description: 'Complete CDS exam prep: English, General Knowledge, and Elementary Mathematics for all four academies.', duration: '5 months', mode: 'Online', rating: 4.7, learner_count: 7200, review_count: 950 },
    { title: 'CDS English Language', subtitle: 'Grammar & Comprehension for CDS', description: 'English for CDS: synonyms, antonyms, idioms, reading comprehension, ordering of sentences, and spotting errors.', duration: '2 months', mode: 'Online', rating: 4.6, learner_count: 5900, review_count: 780 },
    { title: 'CDS General Knowledge', subtitle: 'History, Geography & Current Affairs', description: 'GK for CDS: Indian History, World History, Indian Geography, Indian Polity, and monthly current affairs updates.', duration: '3 months', mode: 'Online', rating: 4.6, learner_count: 6400, review_count: 850 },
    { title: 'CDS Elementary Mathematics', subtitle: 'Score full in the Maths paper', description: 'Mathematics for CDS: arithmetic, number system, mensuration, algebra, trigonometry, statistics, and geometry.', duration: '2 months', mode: 'Online', rating: 4.5, learner_count: 5600, review_count: 740 },
    { title: 'SSB Interview for CDS Candidates', subtitle: 'From written to commission', description: 'SSB interview: psychological tests, GTO tasks, group discussions, personal interview, and developing Officer Like Qualities.', duration: '2 months', mode: 'Online', rating: 4.8, learner_count: 3800, review_count: 500 },
    { title: 'CDS General Science', subtitle: 'Physics, Chemistry & Biology basics', description: 'General Science for CDS GK section: Class 10-12 Physics, Chemistry, Biology, and their defence applications.', duration: '1 month', mode: 'Online', rating: 4.4, learner_count: 4900, review_count: 650 },
    { title: 'Defence Current Affairs for CDS', subtitle: 'Military & geopolitical awareness', description: 'Defence current affairs: military exercises, defence treaties, latest acquisitions, geopolitical developments, and global security.', duration: '3 months', mode: 'Online', rating: 4.6, learner_count: 5200, review_count: 690 },
    { title: 'CDS Crash Course — 60 Days', subtitle: 'Last-minute intensive revision', description: '60-day intensive CDS crash course: daily study plan, daily tests, all three subjects, and exam-day strategy.', duration: '2 months', mode: 'Online', rating: 4.7, learner_count: 8900, review_count: 1180 },
    { title: 'CDS Mock Test Series', subtitle: '90 chapter-wise and full-length tests', description: '90 tests for CDS: section-wise, chapter-wise, and full-length papers with detailed performance analysis.', duration: '3 months', mode: 'Online', rating: 4.7, learner_count: 9800, review_count: 1300 },
    { title: 'CDS Previous Year Papers (2016–2024)', subtitle: 'Understand the exam pattern deeply', description: 'All CDS papers from 2016-2024 fully solved with topic analysis, marks distribution, and trend prediction.', duration: '1 month', mode: 'Online', rating: 4.8, learner_count: 10600, review_count: 1400 },
  ],
};

// ─── HELPER: create curriculum from topics ──────────────────────────────────

function buildCurriculum(topics) {
  const chunkSize = Math.ceil(topics.length / 4);
  const modules = [];
  for (let i = 0; i < 4; i++) {
    const chunk = topics.slice(i * chunkSize, (i + 1) * chunkSize);
    if (chunk.length > 0) {
      modules.push({ title: `Module ${i + 1}`, topics: chunk });
    }
  }
  return modules;
}

function defaultTopics(title) {
  return [
    'Introduction & Overview', 'Core Fundamentals', 'Advanced Concepts',
    'Practice & Application', 'Mock Tests', 'Revision & Strategy'
  ];
}

function buildHighlights(theme, topics) {
  const iconMap = { web_frontend: 'code', web_backend: 'database', ml: 'cpu', dl: 'cpu',
    data_analysis: 'target', data_viz: 'star', cloud: 'globe', devops: 'shield',
    ethical_hacking: 'zap', network_security: 'shield',
    upsc_prelims: 'book', upsc_mains: 'award', ssc_cgl: 'star', ssc_chsl: 'star',
    ibps: 'briefcase', sbi: 'briefcase', rrb_ntpc: 'trending', rrb_gd: 'users',
    nda: 'shield', cds: 'shield' };
  const icon = iconMap[theme] || 'star';
  return (topics || []).slice(0, 4).map(t => ({ icon, label: t }));
}

function buildChecklist(theme) {
  const lists = {
    web_frontend: ['Live projects included','Certificate on completion','Lifetime access','Job support included'],
    web_backend: ['Industry-grade projects','API development practice','Deployment workshops','Resume assistance'],
    ml: ['Kaggle competition training','Real datasets used','Model deployment covered','Industry mentors'],
    dl: ['GPU access provided','Research paper walkthroughs','Production deployment','Paper reviews'],
    data_analysis: ['Business case studies','Real datasets','Dashboard creation','SQL labs included'],
    data_viz: ['Tool licenses included','Design reviews','Client dashboard projects','Portfolio building'],
    cloud: ['Hands-on labs','Cloud credits provided','Certification prep','Job placement support'],
    devops: ['Industry tools covered','Project-based learning','DevOps certification prep','24/7 lab access'],
    ethical_hacking: ['Legal lab environment','Bug bounty guidance','CTF practice included','Real tool usage'],
    network_security: ['Lab environment included','Security+ prep','24/7 support','Hands-on with tools'],
    upsc_prelims: ['Mentorship by IAS officers','Daily current affairs','Doubt clearing sessions','Mock interview'],
    upsc_mains: ['Answer evaluation by experts','Weekly test series','IAS mentor guidance','Complete material'],
    ssc_cgl: ['Previous year papers','All India mock tests','Speed tips','Video + PDF notes'],
    ssc_chsl: ['Typing test training','All sections covered','Mock tests daily','Doubt sessions'],
    ibps: ['Banking awareness updates','Interview guidance','Online mock tests','Expert faculty'],
    sbi: ['SBI-specific questions','Interview coaching','Group discussion prep','Success rate 86%'],
    rrb_ntpc: ['Railway GK special','PET guidance','Mock test series','NTPC-specific content'],
    rrb_gd: ['PET fitness guide','Group D specific prep','Bilingual content','Daily practice tests'],
    nda: ['SSB guidance included','Maths problem bank','GAT complete notes','Defence current affairs'],
    cds: ['SSB preparation','All three subjects','Previous year papers','Mock SSB sessions'],
  };
  return (lists[theme] || ['Certificate on completion','Experienced faculty','Recorded lectures','Doubt support']);
}

function buildOverviewFaqs(theme, title) {
  return [
    { question: `Who should enroll in ${title}?`, answer: `This course is ideal for students and professionals looking to build strong skills in ${title}. Whether you're a beginner or want to upgrade your knowledge, this course is designed for you.` },
    { question: 'What are the prerequisites?', answer: 'Basic computer proficiency and willingness to learn. Specific technical prerequisites are mentioned in the course description.' },
    { question: 'Will I get a certificate?', answer: 'Yes! Upon successful completion of the course, you will receive a certificate of completion recognized by industry partners.' },
    { question: 'How long will I have access to the course?', answer: 'You will have lifetime access to all course materials including updates and new content added in the future.' },
    { question: 'Is there any doubt-clearing support?', answer: 'Yes, we offer live doubt-clearing sessions twice a week and a dedicated support channel for quick question resolution.' },
  ];
}

function buildFaqs(title) {
  return [
    { question: `Is ${title} course worth it?`, answer: 'Absolutely! Our students consistently achieve top results and career transitions after completing this course. We have a 94% satisfaction rate.' },
    { question: 'Can I access the course on mobile?', answer: 'Yes, our platform is fully mobile-compatible. You can learn anytime, anywhere from your smartphone or tablet.' },
    { question: 'What if I am not satisfied?', answer: 'We offer a 7-day money-back guarantee. If you are not satisfied for any reason, you will receive a full refund.' },
    { question: 'Is the course updated regularly?', answer: 'Yes, we update course content regularly to match the latest syllabus changes, industry trends, and exam patterns.' },
  ];
}

function buildProjects(theme, catLabel) {
  const sw = ['web_frontend','web_backend','ml','dl','data_analysis','data_viz','cloud','devops','ethical_hacking','network_security'];
  if (sw.includes(theme)) {
    return [
      { title: 'Capstone Project 1', description: `Build a real-world project applying core concepts from ${catLabel}. This project will be portfolio-ready.` },
      { title: 'Capstone Project 2', description: `Advanced project that integrates multiple skills learned in the ${catLabel} course for a complete application.` },
    ];
  }
  return [
    { title: 'Practice Set Project', description: `Solve 500 questions from ${catLabel} topics with detailed solution walkthrough.` },
    { title: 'Mock Exam Simulation', description: `Complete full-length mock simulation for ${catLabel} with real exam conditions.` },
  ];
}

function buildCertification(theme) {
  const isSw = ['web_frontend','web_backend','ml','dl','data_analysis','data_viz','cloud','devops','ethical_hacking','network_security'].includes(theme);
  return {
    description: isSw
      ? 'Upon completing this course, you will receive an industry-recognized certificate that demonstrates your proficiency and practical skills.'
      : 'Receive a course completion certificate after clearing the internal assessment. This can be added to your resume to showcase exam preparation commitment.',
    recognized_companies: isSw
      ? ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Capgemini', 'HCL', 'Tech Mahindra', 'Cognizant']
      : [],
  };
}

// ─── MAIN SEED FUNCTION ──────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   MARVEL SLICE — COURSE SEEDING (10 per category)   ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Verify backup exists
  if (!fs.existsSync(path.join(__dirname, 'courses/courses_raw.json'))) {
    console.error('❌ Backup not found! Run extract_all.cjs first!');
    process.exit(1);
  }
  const backup = JSON.parse(fs.readFileSync(path.join(__dirname, 'courses/courses_raw.json'), 'utf8'));
  console.log(`✓ Backup verified: ${backup.length} existing courses saved in data/courses/courses_raw.json\n`);

  // ── Step 1: Delete all existing courses ────────────────────────────────────
  console.log('── STEP 1: Deleting all existing courses ─────────────');

  // Delete in dependency order (children first)
  const tables = ['course_tabs','faqs','highlights','overview_faqs','course_fees','projects','certifications','course_tags','related_courses'];
  for (const t of tables) {
    const { error } = await sb.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.log(`  ⚠ ${t}: ${error.message}`);
    else console.log(`  ✓ Cleared ${t}`);
  }
  const { error: courseDelErr } = await sb.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (courseDelErr) { console.error('  ✗ Failed to delete courses:', courseDelErr.message); process.exit(1); }
  console.log('  ✓ Deleted all courses\n');

  // ── Step 2: Seed 10 courses per category ───────────────────────────────────
  console.log('── STEP 2: Seeding 10 courses per category ───────────\n');

  let totalInserted = 0;

  for (const cat of NAV_CATEGORIES) {
    const themeData = THEMES[cat.theme] || [];
    if (themeData.length === 0) {
      console.log(`  ⚠ No theme data for ${cat.label} (${cat.theme}), skipping`);
      continue;
    }

    console.log(`  ► ${cat.section} > ${cat.parent} > ${cat.label} (${themeData.length} courses)`);

    for (let i = 0; i < themeData.length; i++) {
      const t = themeData[i];
      const topics = t.topics || defaultTopics(t.title);
      const slug = t.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) + '-' + cat.theme.slice(0,4) + '-' + (i + 1);

      // Insert course
      const coursePayload = {
        slug,
        title: t.title,
        subtitle: t.subtitle,
        description: t.description,
        nav_item_id: cat.id,
        duration: t.duration,
        mode: t.mode || 'Online',
        status: 'Active',
        is_published: true,
        cta_left: 'Talk to Advisor',
        cta_right: 'Download Brochure',
        rating: t.rating || 0,
        review_count: t.review_count || 0,
        learner_count: t.learner_count || 0,
        checklist_items: buildChecklist(cat.theme),
        curriculum: buildCurriculum(topics),
        show_pricing: false,
        cta_heading: 'Start Learning Today',
        cta_description: 'Join thousands of successful students and take the next step in your career.',
        cta_text: 'Enroll Now',
        cta_link: '/contact',
        cta_phone: '+91 80001 00001',
      };

      const { data: inserted, error: insErr } = await sb.from('courses').insert(coursePayload).select('id').single();
      if (insErr) {
        console.log(`    ✗ ${t.title}: ${insErr.message}`);
        continue;
      }
      const cid = inserted.id;

      // Highlights
      const highlights = buildHighlights(cat.theme, topics);
      if (highlights.length > 0) {
        await sb.from('highlights').insert(highlights.map((h, idx) => ({ ...h, course_id: cid, sort_order: idx })));
      }

      // Overview FAQs
      const ovFaqs = buildOverviewFaqs(cat.theme, t.title);
      await sb.from('overview_faqs').insert(ovFaqs.map((f, idx) => ({ ...f, course_id: cid, sort_order: idx })));

      // Projects
      const projs = buildProjects(cat.theme, cat.label);
      await sb.from('projects').insert(projs.map((p, idx) => ({ ...p, course_id: cid, sort_order: idx })));

      // Certification
      const cert = buildCertification(cat.theme);
      await sb.from('certifications').insert({ ...cert, course_id: cid });

      // FAQs
      const faqs = buildFaqs(t.title);
      await sb.from('faqs').insert(faqs.map((f, idx) => ({ ...f, course_id: cid, sort_order: idx })));

      // Course tabs
      const tabs = [
        { label: 'Overview', content_type: 'rich_text', content: { body: t.description }, sort_order: 0 },
        { label: 'Curriculum', content_type: 'rich_text', content: { body: topics.join(', ') }, sort_order: 1 },
        { label: 'Instructors', content_type: 'rich_text', content: { body: 'Expert faculty with 10+ years industry experience.' }, sort_order: 2 },
        { label: 'Reviews', content_type: 'rich_text', content: { body: `Rated ${t.rating}/5 by ${t.review_count} students.` }, sort_order: 3 },
      ];
      await sb.from('course_tabs').insert(tabs.map(tb => ({ ...tb, course_id: cid })));

      totalInserted++;
      process.stdout.write(`    ✓ [${i + 1}/${themeData.length}] ${t.title}\n`);
    }
    console.log();
  }

  // ── Step 3: Save updated summary ───────────────────────────────────────────
  const seedSummary = {
    seeded_at: new Date().toISOString(),
    total_courses_seeded: totalInserted,
    categories: NAV_CATEGORIES.map(c => ({
      section: c.section,
      parent: c.parent,
      label: c.label,
      theme: c.theme,
      nav_item_id: c.id,
      courses_seeded: (THEMES[c.theme] || []).length,
    })),
  };
  fs.writeFileSync(path.join(__dirname, 'courses/seed_summary.json'), JSON.stringify(seedSummary, null, 2));

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║                  SEEDING COMPLETE                   ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`\nTotal courses seeded: ${totalInserted}`);
  console.log(`Categories processed: ${NAV_CATEGORIES.length}`);
  console.log('\nBackup of old courses: data/courses/courses_raw.json');
  console.log('Seed summary saved: data/courses/seed_summary.json\n');
}

main().catch(e => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
