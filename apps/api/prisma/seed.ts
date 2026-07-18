import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Users (1 per role) ─────────────────────────────────────────────────────
  const superAdmin = await upsertUser(
    "superadmin@lms.local", "Super Admin", "superadmin123", "SUPER_ADMIN",
  );
  console.log("✅ Super Admin:", superAdmin.email);

  const admin = await upsertUser(
    "admin@lms.local", "Admin User", "admin123", "ADMIN",
  );
  console.log("✅ Admin:", admin.email);

  const instructor = await upsertUser(
    "instructor@lms.local", "Demo Instructor", "instructor123", "INSTRUCTOR",
  );
  console.log("✅ Instructor:", instructor.email);

  const student = await upsertUser(
    "student@lms.local", "Demo Student", "student123", "STUDENT",
  );
  console.log("✅ Student:", student.email);

  // ─── System Settings ────────────────────────────────────────────────────────
  const defaultSettings = [
    { key: "super_admin_id", value: superAdmin.id, type: "string", description: "Auto-set when SUPER_ADMIN exists" },
    { key: "platform_name", value: "Marvel Slice LMS", type: "string", description: "Display name for the LMS" },
    { key: "default_session_duration", value: "60", type: "number", description: "Default meeting length in minutes" },
    { key: "max_students_per_batch", value: "100", type: "number", description: "Global hard cap per batch" },
    { key: "session_timeout_admin", value: "480", type: "number", description: "Admin session timeout in minutes" },
    { key: "session_timeout_instructor", value: "480", type: "number", description: "Instructor session timeout in minutes" },
    { key: "session_timeout_student", value: "480", type: "number", description: "Student session timeout in minutes" },
  ];
  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log("✅ System settings seeded");

  // ─── Courses ────────────────────────────────────────────────────────────────
  // Course 1: Python for Data Science (full content)
  const pythonCourse = await upsertCourse({
    slug: "python-for-data-science",
    title: "Python for Data Science",
    description: "Master Python for data analysis, visualization, and machine learning. Covers Python fundamentals, NumPy, Pandas, Matplotlib, Seaborn, and Scikit-learn.",
    category: "Data Science",
    createdBy: instructor.id,
    tags: ["python", "data-science", "pandas", "numpy", "matplotlib", "scikit-learn"],
    learningObjectives: [
      "Write Python scripts with confidence",
      "Manipulate data with NumPy and Pandas",
      "Create insightful visualizations with Matplotlib and Seaborn",
      "Build and evaluate machine learning models with Scikit-learn",
    ],
  });

  // Course 2: SQL for Data Analysis (placeholder)
  const sqlCourse = await upsertCourse({
    slug: "sql-for-data-analysis",
    title: "SQL for Data Analysis",
    description: "Learn SQL from basics to advanced queries for data analysis and reporting.",
    category: "Data Science",
    createdBy: instructor.id,
    tags: ["sql", "data-analysis", "databases"],
    learningObjectives: [
      "Write complex SQL queries",
      "Use JOINs, subqueries, and window functions",
      "Optimize query performance",
    ],
  });

  // Course 3: Machine Learning Basics (placeholder)
  const mlCourse = await upsertCourse({
    slug: "machine-learning-basics",
    title: "Machine Learning Basics",
    description: "Introduction to machine learning concepts, algorithms, and practical implementations.",
    category: "Data Science",
    createdBy: instructor.id,
    tags: ["machine-learning", "ai", "data-science"],
    learningObjectives: [
      "Understand supervised and unsupervised learning",
      "Build classification and regression models",
      "Evaluate model performance",
    ],
  });

  console.log("✅ Courses created");

  // ─── Package (needed before batch) ───────────────────────────────────────────
  const dataSciencePkg = await prisma.coursePackage.upsert({
    where: { id: "pkg-datascience" },
    update: {},
    create: {
      id: "pkg-datascience",
      name: "Data Science Program",
      description: "Complete data science track: Python, SQL, and Machine Learning.",
      status: "ACTIVE",
      courses: {
        create: [
          { courseId: pythonCourse.id, order: 0 },
          { courseId: sqlCourse.id, order: 1 },
          { courseId: mlCourse.id, order: 2 },
        ],
      },
    },
  });
  console.log("✅ Package created");

  // ─── Batch (needed before assignments — batchId is required) ─────────────────
  const pkgBatch = await prisma.batch.upsert({
    where: { id: "batch-datascience" },
    update: {},
    create: {
      id: "batch-datascience",
      courseId: null,
      packageId: dataSciencePkg.id,
      instructorId: instructor.id,
      name: "Data Science Batch — Jul 2025",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2026-01-31"),
      maxStudents: 50,
      status: "ACTIVE",
      description: "Package-level batch for the Data Science Program.",
    },
  });
  console.log("✅ Batch created");

  // ─── Python: Modules, Lessons, Quizzes, Assignments, Study Materials ────────
  const pythonModule1 = await upsertModule(pythonCourse.id, {
    title: "Python Fundamentals",
    description: "Core Python concepts — variables, control flow, functions, and modules.",
    order: 0, isFreePreview: true,
  });
  const pythonModule2 = await upsertModule(pythonCourse.id, {
    title: "NumPy & Pandas",
    description: "Numerical computing with NumPy and data manipulation with Pandas.",
    order: 1, isFreePreview: false,
  });
  const pythonModule3 = await upsertModule(pythonCourse.id, {
    title: "Data Visualization",
    description: "Create stunning charts and visualizations with Matplotlib and Seaborn.",
    order: 2, isFreePreview: false,
  });
  const pythonModule4 = await upsertModule(pythonCourse.id, {
    title: "Intro to Machine Learning",
    description: "Build predictive models with Scikit-learn.",
    order: 3, isFreePreview: false,
  });

  // ─── Module 1: Python Fundamentals ────────────────────────────────────────────
  await upsertLessons(pythonModule1.id, [
    {
      title: "Variables & Data Types",
      description: "Strings, numbers, booleans, and type conversion in Python.",
      videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
      videoEmbedId: "_uQrJ0TkZlc",
      durationSeconds: 960, order: 0, isFreePreview: true,
      resources: [{ name: "Python Official Docs", url: "https://docs.python.org/3/" }],
    },
    {
      title: "Control Flow & Loops",
      description: "if/else, for loops, while loops, and list comprehensions.",
      videoUrl: "https://www.youtube.com/watch?v=khKv-8q7YmY",
      videoEmbedId: "khKv-8q7YmY",
      durationSeconds: 1080, order: 1,
      resources: [{ name: "W3Schools Python", url: "https://www.w3schools.com/python/" }],
    },
    {
      title: "Functions & Modules",
      description: "Defining functions, arguments, return values, and importing modules.",
      videoUrl: "https://www.youtube.com/watch?v=9Os0o3wzS_I",
      videoEmbedId: "9Os0o3wzS_I",
      durationSeconds: 1140, order: 2,
      resources: [{ name: "Real Python Functions", url: "https://realpython.com/defining-your-own-python-function/" }],
    },
  ]);

  await createQuiz(pythonModule1.id, "Python Fundamentals Quiz", 0, [
    { text: "Which of the following is a mutable data type in Python?", options: [{ label: "Tuple", isCorrect: false }, { label: "String", isCorrect: false }, { label: "List", isCorrect: true }, { label: "Integer", isCorrect: false }] },
    { text: "What does the `len()` function return?", options: [{ label: "Type of object", isCorrect: false }, { label: "Length of object", isCorrect: true }, { label: "Memory size", isCorrect: false }, { label: "Hash value", isCorrect: false }] },
    { text: "Which keyword is used to define a function in Python?", options: [{ label: "function", isCorrect: false }, { label: "def", isCorrect: true }, { label: "define", isCorrect: false }, { label: "func", isCorrect: false }] },
    { text: "What is the output of `print(2 ** 3)`?", options: [{ label: "6", isCorrect: false }, { label: "8", isCorrect: true }, { label: "9", isCorrect: false }, { label: "5", isCorrect: false }] },
    { text: "Which of the following creates a list in Python?", options: [{ label: "{}", isCorrect: false }, { label: "[]", isCorrect: true }, { label: "()", isCorrect: false }, { label: "<>", isCorrect: false }] },
  ]);

  await createAssignment(pythonModule1.id, pythonCourse.id, pkgBatch.id, "Python Basics Assignment", 0, [
    { questionText: "What is the correct way to create a variable in Python?", marks: 1, options: [{ optionText: "var x = 10", isCorrect: false }, { optionText: "x = 10", isCorrect: true }, { optionText: "int x = 10", isCorrect: false }, { optionText: "x := 10", isCorrect: false }] },
    { questionText: "Which loop is used when the number of iterations is known?", marks: 1, options: [{ optionText: "while loop", isCorrect: false }, { optionText: "for loop", isCorrect: true }, { optionText: "do-while loop", isCorrect: false }, { optionText: "repeat loop", isCorrect: false }] },
    { questionText: "What does the `return` statement do?", marks: 1, options: [{ optionText: "Exits the program", isCorrect: false }, { optionText: "Sends a value back to the caller", isCorrect: true }, { optionText: "Prints a value", isCorrect: false }, { optionText: "Restarts the function", isCorrect: false }] },
  ]);

  // ─── Module 2: NumPy & Pandas ───────────────────────────────────────────────
  await upsertLessons(pythonModule2.id, [
    {
      title: "NumPy Arrays",
      description: "Creating and manipulating multi-dimensional arrays with NumPy.",
      videoUrl: "https://www.youtube.com/watch?v=KlBPCzcQNU8",
      videoEmbedId: "KlBPCzcQNU8",
      durationSeconds: 1200, order: 0,
      resources: [{ name: "NumPy Quickstart", url: "https://numpy.org/doc/stable/user/quickstart.html" }],
    },
    {
      title: "Pandas Series & DataFrames",
      description: "Working with labeled data structures — Series and DataFrame.",
      videoUrl: "https://www.youtube.com/watch?v=QUT1VZ6Vx1o",
      videoEmbedId: "QUT1VZ6Vx1o",
      durationSeconds: 1320, order: 1,
      resources: [{ name: "Pandas Getting Started", url: "https://pandas.pydata.org/docs/getting_started/index.html" }],
    },
    {
      title: "Data Cleaning with Pandas",
      description: "Handling missing values, duplicates, and data transformations.",
      videoUrl: "https://www.youtube.com/watch?v=H37f_x4wAC0",
      videoEmbedId: "H37f_x4wAC0",
      durationSeconds: 1260, order: 2,
      resources: [{ name: "Pandas Data Cleaning", url: "https://pandas.pydata.org/docs/user_guide/missing_data.html" }],
    },
  ]);

  await createQuiz(pythonModule2.id, "NumPy & Pandas Quiz", 0, [
    { text: "Which NumPy function creates an array of zeros?", options: [{ label: "np.zeros()", isCorrect: true }, { label: "np.empty()", isCorrect: false }, { label: "np.null()", isCorrect: false }, { label: "np.blank()", isCorrect: false }] },
    { text: "How do you read a CSV file into a Pandas DataFrame?", options: [{ label: "pd.load_csv()", isCorrect: false }, { label: "pd.read_csv()", isCorrect: true }, { label: "pd.open_csv()", isCorrect: false }, { label: "pd.import_csv()", isCorrect: false }] },
    { text: "Which method removes missing values in Pandas?", options: [{ label: "df.dropna()", isCorrect: true }, { label: "df.remove_na()", isCorrect: false }, { label: "df.clean()", isCorrect: false }, { label: "df.filter()", isCorrect: false }] },
    { text: "What attribute gives the shape of a NumPy array?", options: [{ label: ".size", isCorrect: false }, { label: ".dim", isCorrect: false }, { label: ".shape", isCorrect: true }, { label: ".length", isCorrect: false }] },
    { text: "Which Pandas function computes descriptive statistics?", options: [{ label: "df.summarize()", isCorrect: false }, { label: "df.describe()", isCorrect: true }, { label: "df.stats()", isCorrect: false }, { label: "df.info()", isCorrect: false }] },
  ]);

  await createAssignment(pythonModule2.id, pythonCourse.id, pkgBatch.id, "Data Manipulation Task", 1, [
    { questionText: "What method is used to select a single column in a Pandas DataFrame?", marks: 1, options: [{ optionText: "df['column']", isCorrect: true }, { optionText: "df.column()", isCorrect: false }, { optionText: "df.get('column')", isCorrect: false }, { optionText: "df.select('column')", isCorrect: false }] },
    { questionText: "Which NumPy function computes the mean of an array?", marks: 1, options: [{ optionText: "np.average()", isCorrect: false }, { optionText: "np.mean()", isCorrect: true }, { optionText: "np.median()", isCorrect: false }, { optionText: "np.central()", isCorrect: false }] },
    { questionText: "What does `df.groupby('col').sum()` do?", marks: 1, options: [{ optionText: "Groups by column and sums each group", isCorrect: true }, { optionText: "Sums all rows", isCorrect: false }, { optionText: "Creates a pivot table", isCorrect: false }, { optionText: "Merges two DataFrames", isCorrect: false }] },
  ]);

  // ─── Module 3: Data Visualization ────────────────────────────────────────────
  await upsertLessons(pythonModule3.id, [
    {
      title: "Matplotlib Basics",
      description: "Creating line plots, bar charts, scatter plots, and histograms.",
      videoUrl: "https://www.youtube.com/watch?v=DAQNHzOcO5A",
      videoEmbedId: "DAQNHzOcO5A",
      durationSeconds: 1380, order: 0,
      resources: [{ name: "Matplotlib Gallery", url: "https://matplotlib.org/stable/gallery/index.html" }],
    },
    {
      title: "Seaborn for Statistical Plots",
      description: "Creating beautiful statistical visualizations with Seaborn.",
      videoUrl: "https://www.youtube.com/watch?v=wD2V4PzH7UY",
      videoEmbedId: "wD2V4PzH7UY",
      durationSeconds: 1140, order: 1,
      resources: [{ name: "Seaborn Tutorial", url: "https://seaborn.pydata.org/tutorial.html" }],
    },
  ]);

  await createQuiz(pythonModule3.id, "Data Visualization Quiz", 0, [
    { text: "Which import statement is correct for Matplotlib?", options: [{ label: "import matplotlibplotlib as plt", isCorrect: false }, { label: "import matplotlib.pyplot as plt", isCorrect: true }, { label: "import matplot as plt", isCorrect: false }, { label: "import plotly as plt", isCorrect: false }] },
    { text: "Which function creates a bar chart in Matplotlib?", options: [{ label: "plt.plot()", isCorrect: false }, { label: "plt.bar()", isCorrect: true }, { label: "plt.hist()", isCorrect: false }, { label: "plt.scatter()", isCorrect: false }] },
    { text: "Seaborn is built on top of which library?", options: [{ label: "Plotly", isCorrect: false }, { label: "Bokeh", isCorrect: false }, { label: "Matplotlib", isCorrect: true }, { label: "Pandas", isCorrect: false }] },
    { text: "Which function displays the plot in Matplotlib?", options: [{ label: "plt.show()", isCorrect: true }, { label: "plt.display()", isCorrect: false }, { label: "plt.render()", isCorrect: false }, { label: "plt.output()", isCorrect: false }] },
    { text: "What does a heatmap visualize?", options: [{ label: "Line relationships", isCorrect: false }, { label: "Correlation matrix values", isCorrect: true }, { label: "Bar comparisons", isCorrect: false }, { label: "Pie distributions", isCorrect: false }] },
  ]);

  await createAssignment(pythonModule3.id, pythonCourse.id, pkgBatch.id, "Visualization Challenge", 2, [
    { questionText: "How do you create a 2x2 grid of subplots?", marks: 1, options: [{ optionText: "plt.subplot(2, 2)", isCorrect: false }, { optionText: "plt.subplots(2, 2)", isCorrect: true }, { optionText: "plt.grid(2, 2)", isCorrect: false }, { optionText: "plt.figure(2, 2)", isCorrect: false }] },
    { questionText: "Which Seaborn function creates a scatter plot?", marks: 1, options: [{ optionText: "sns.lineplot()", isCorrect: false }, { optionText: "sns.barplot()", isCorrect: false }, { optionText: "sns.scatterplot()", isCorrect: true }, { optionText: "sns.pointplot()", isCorrect: false }] },
    { questionText: "What does `plt.savefig('chart.png')` do?", marks: 1, options: [{ optionText: "Saves the figure to a file", isCorrect: true }, { optionText: "Opens the figure in a viewer", isCorrect: false }, { optionText: "Prints the figure", isCorrect: false }, { optionText: "Closes the figure", isCorrect: false }] },
  ]);

  // ─── Module 4: Intro to Machine Learning ──────────────────────────────────────
  await upsertLessons(pythonModule4.id, [
    {
      title: "Supervised Learning Concepts",
      description: "Understanding classification, regression, and train/test splits.",
      videoUrl: "https://www.youtube.com/watch?v=0Lt9w-BxXsQ",
      videoEmbedId: "0Lt9w-BxXsQ",
      durationSeconds: 1440, order: 0,
      resources: [{ name: "Scikit-learn Docs", url: "https://scikit-learn.org/stable/" }],
    },
    {
      title: "Building a Model Pipeline",
      description: "Data preprocessing, training, and evaluation with Scikit-learn.",
      videoUrl: "https://www.youtube.com/watch?v=0Lt9w-BxXsQ",
      videoEmbedId: "0Lt9w-BxXsQ",
      durationSeconds: 1560, order: 1,
      resources: [{ name: "Scikit-learn Tutorial", url: "https://scikit-learn.org/stable/tutorial/index.html" }],
    },
  ]);

  await createQuiz(pythonModule4.id, "ML Basics Quiz", 0, [
    { text: "Which of the following is a supervised learning algorithm?", options: [{ label: "K-Means", isCorrect: false }, { label: "Linear Regression", isCorrect: true }, { label: "PCA", isCorrect: false }, { label: "DBSCAN", isCorrect: false }] },
    { text: "What does `train_test_split` do?", options: [{ label: "Splits data into training and testing sets", isCorrect: true }, { label: "Splits features into categories", isCorrect: false }, { label: "Splits the model into layers", isCorrect: false }, { label: "Splits the dataset into equal parts", isCorrect: false }] },
    { text: "Which metric is used for classification accuracy?", options: [{ label: "Mean Squared Error", isCorrect: false }, { label: "R-squared", isCorrect: false }, { label: "F1 Score", isCorrect: true }, { label: "Mean Absolute Error", isCorrect: false }] },
    { text: "What is overfitting?", options: [{ label: "Model performs well on train but poorly on test", isCorrect: true }, { label: "Model performs well on test but poorly on train", isCorrect: false }, { label: "Model trains too slowly", isCorrect: false }, { label: "Model has too few parameters", isCorrect: false }] },
    { text: "Which Scikit-learn class is used for decision trees?", options: [{ label: "DecisionTree", isCorrect: false }, { label: "DecisionTreeRegressor", isCorrect: false }, { label: "DecisionTreeClassifier", isCorrect: true }, { label: "TreeClassifier", isCorrect: false }] },
  ]);

  await createAssignment(pythonModule4.id, pythonCourse.id, pkgBatch.id, "ML Model Building", 3, [
    { questionText: "What is the purpose of `StandardScaler`?", marks: 1, options: [{ optionText: "Standardizes features by removing mean and scaling to unit variance", isCorrect: true }, { optionText: "Scales data to a fixed range", isCorrect: false }, { optionText: "Normalizes rows to unit norm", isCorrect: false }, { optionText: "Fills missing values", isCorrect: false }] },
    { questionText: "Which method trains a Scikit-learn model?", marks: 1, options: [{ optionText: "model.train()", isCorrect: false }, { optionText: "model.fit()", isCorrect: true }, { optionText: "model.learn()", isCorrect: false }, { optionText: "model.run()", isCorrect: false }] },
    { questionText: "What does `cross_val_score` evaluate?", marks: 1, options: [{ optionText: "Single train/test split performance", isCorrect: false }, { optionText: "Cross-validated model performance", isCorrect: true }, { optionText: "Feature importance scores", isCorrect: false }, { optionText: "Model training time", isCorrect: false }] },
  ]);

  console.log("✅ Python course content created (modules, lessons, quizzes, assignments, study materials)");

  // ─── Set contentOrder on Python modules ──────────────────────────────────────
  for (const moduleId of [pythonModule1.id, pythonModule2.id, pythonModule3.id, pythonModule4.id]) {
    const lessons = await prisma.lesson.findMany({ where: { moduleId }, orderBy: { order: "asc" }, select: { id: true } });
    const quizzes = await prisma.quiz.findMany({ where: { moduleId }, orderBy: { order: "asc" }, select: { id: true } });
    const assignments = await prisma.assignment.findMany({ where: { moduleId }, orderBy: { order: "asc" }, select: { id: true } });
    const contentOrder = [
      ...lessons.map((l) => ({ type: "LESSON" as const, id: l.id })),
      ...quizzes.map((q) => ({ type: "QUIZ" as const, id: q.id })),
      ...assignments.map((a) => ({ type: "ASSIGNMENT" as const, id: a.id })),
    ];
    await prisma.module.update({ where: { id: moduleId }, data: { contentOrder } });
  }

  // ─── SQL Course: minimal placeholder ─────────────────────────────────────────
  const sqlModule1 = await upsertModule(sqlCourse.id, {
    title: "SQL Fundamentals", description: "Basic SQL queries.", order: 0, isFreePreview: true,
  });
  await upsertLessons(sqlModule1.id, [
    {
      title: "SELECT & WHERE Clauses",
      description: "Basic querying and filtering.",
      videoUrl: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
      videoEmbedId: "HXV3zeQKqGY",
      durationSeconds: 900, order: 0, isFreePreview: true,
    },
    {
      title: "JOINs & Aggregations",
      description: "Combining tables and grouping data.",
      videoUrl: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
      videoEmbedId: "HXV3zeQKqGY",
      durationSeconds: 1080, order: 1,
    },
  ]);
  console.log("✅ SQL course (placeholder) created");

  // ─── ML Course: minimal placeholder ──────────────────────────────────────────
  const mlModule1 = await upsertModule(mlCourse.id, {
    title: "ML Concepts", description: "Core ML concepts.", order: 0, isFreePreview: true,
  });
  await upsertLessons(mlModule1.id, [
    {
      title: "Types of Machine Learning",
      description: "Supervised, unsupervised, reinforcement.",
      videoUrl: "https://www.youtube.com/watch?v=0Lt9w-BxXsQ",
      videoEmbedId: "0Lt9w-BxXsQ",
      durationSeconds: 900, order: 0, isFreePreview: true,
    },
    {
      title: "Model Evaluation",
      description: "Accuracy, precision, recall, F1.",
      videoUrl: "https://www.youtube.com/watch?v=0Lt9w-BxXsQ",
      videoEmbedId: "0Lt9w-BxXsQ",
      durationSeconds: 1020, order: 1,
    },
  ]);
  console.log("✅ ML course (placeholder) created");

  // ─── BatchCourseVisibility: first course visible ─────────────────────────────
  await prisma.batchCourseVisibility.upsert({
    where: { batchId_courseId: { batchId: pkgBatch.id, courseId: pythonCourse.id } },
    update: { isVisible: true },
    create: { batchId: pkgBatch.id, courseId: pythonCourse.id, isVisible: true },
  });
  console.log("✅ Batch course visibility set (Python visible)");

  // ─── Enrollment ──────────────────────────────────────────────────────────────
  const existingEnrollment = await prisma.packageEnrollment.findFirst({
    where: { userId: student.id, packageId: dataSciencePkg.id },
  });
  if (!existingEnrollment) {
    const enrollment = await prisma.packageEnrollment.create({
      data: { userId: student.id, packageId: dataSciencePkg.id, status: "APPROVED" },
    });
    const pkgCourses = await prisma.packageCourse.findMany({
      where: { packageId: dataSciencePkg.id },
      select: { courseId: true },
    });
    for (const pc of pkgCourses) {
      await prisma.packageEnrollmentCourse.create({
        data: { enrollmentId: enrollment.id, courseId: pc.courseId, batchId: pkgBatch.id },
      });
    }
  }
  console.log("✅ Enrollment created");

  // ─── Notification Preferences ────────────────────────────────────────────────
  const allUsers = [superAdmin, admin, instructor, student];
  const notifTypes = [
    "SESSION_SCHEDULED", "SESSION_CANCELLED", "RECORDING_AVAILABLE",
    "ENROLLMENT_APPROVED", "ENROLLMENT_REJECTED", "ASSIGNMENT_GRADED",
    "MENTORSHIP_CREATED", "MENTORSHIP_ASSIGNED", "MENTORSHIP_SCHEDULED",
    "MENTORSHIP_COMPLETED", "MENTORSHIP_CANCELLED",
    "SUPPORT_TICKET_CREATED", "SUPPORT_TICKET_RESPONDED", "SUPPORT_TICKET_STATUS_CHANGED",
    "CUSTOM_NOTIFICATION",
  ];
  for (const user of allUsers) {
    for (const type of notifTypes) {
      await prisma.notificationPreference.upsert({
        where: { userId_type: { userId: user.id, type } },
        update: {},
        create: { userId: user.id, type, enabled: true, email: true },
      });
    }
  }
  console.log("✅ Notification preferences seeded");

  console.log("\n🎉 Seed complete!");
  console.log("   Super Admin: superadmin@lms.local / superadmin123");
  console.log("   Admin:       admin@lms.local / admin123");
  console.log("   Instructor:  instructor@lms.local / instructor123");
  console.log("   Student:     student@lms.local / student123");
  console.log("   Courses: Python for Data Science (full), SQL (placeholder), ML (placeholder)");
  console.log("   Package: Data Science Program — Batch: Data Science Batch — Jul 2025");
  console.log("   BatchCourseVisibility: Python course visible, others hidden");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertUser(
  email: string,
  name: string,
  password: string,
  role: "SUPER_ADMIN" | "ADMIN" | "INSTRUCTOR" | "STUDENT",
) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash: hash, role },
  });
}

async function upsertCourse(data: {
  slug: string;
  title: string;
  description: string;
  category: string;
  createdBy: string;
  tags: string[];
  learningObjectives: string[];
}) {
  return prisma.course.upsert({
    where: { slug: data.slug },
    update: {},
    create: {
      ...data,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
}

async function upsertModule(
  courseId: string,
  data: { title: string; description: string; order: number; isFreePreview: boolean },
) {
  const existing = await prisma.module.findFirst({
    where: { courseId, order: data.order },
  });
  if (existing) return existing;

  return prisma.module.create({
    data: { courseId, ...data },
  });
}

async function upsertLessons(
  moduleId: string,
  lessons: {
    title: string;
    description: string;
    videoUrl: string;
    videoEmbedId: string;
    durationSeconds: number;
    order: number;
    isFreePreview?: boolean;
    resources?: { name: string; url: string }[];
  }[],
) {
  const existing = await prisma.lesson.count({ where: { moduleId } });
  if (existing > 0) return;

  await prisma.lesson.createMany({
    data: lessons.map((l) => ({
      moduleId,
      title: l.title,
      description: l.description,
      order: l.order,
      videoType: "youtube",
      videoUrl: l.videoUrl,
      videoEmbedId: l.videoEmbedId,
      durationSeconds: l.durationSeconds,
      isFreePreview: l.isFreePreview ?? false,
      resources: l.resources ?? [],
    })),
  });
}

async function createQuiz(
  moduleId: string,
  title: string,
  order: number,
  questions: { text: string; options: { label: string; isCorrect: boolean }[] }[],
) {
  const existing = await prisma.quiz.findFirst({ where: { moduleId, title } });
  if (existing) return existing;

  return prisma.quiz.create({
    data: {
      moduleId,
      title,
      order,
      questions: {
        create: questions.map((q) => ({
          text: q.text,
          options: q.options,
        })),
      },
    },
  });
}

async function createAssignment(
  moduleId: string,
  courseId: string,
  batchId: string,
  title: string,
  order: number,
  questions: {
    questionText: string;
    marks: number;
    options: { optionText: string; isCorrect: boolean }[];
  }[],
) {
  const existing = await prisma.assignment.findFirst({
    where: { moduleId, title, courseId },
  });
  if (existing) return existing;

  return prisma.assignment.create({
    data: {
      courseId,
      batchId,
      moduleId,
      title,
      description: `Assignment: ${title}`,
      type: "QUIZ",
      order,
      dueDate: new Date("2025-12-31"),
      maxPoints: questions.reduce((sum, q) => sum + q.marks, 0),
      questions: {
        create: questions.map((q, idx) => ({
          questionText: q.questionText,
          marks: q.marks,
          orderIndex: idx,
          options: {
            create: q.options,
          },
        })),
      },
    },
  });
}

async function upsertBatch(data: {
  courseId: string;
  instructorId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  maxStudents: number;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  description: string;
}) {
  const existing = await prisma.batch.findFirst({
    where: { courseId: data.courseId, name: data.name },
  });
  if (existing) return existing;

  return prisma.batch.create({ data });
}

main()
  .catch((e: unknown) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
