-- ============================================================
-- MARVEL SLICE — SERVICES SEED DATA
-- Run in Supabase SQL Editor AFTER services-schema.sql
-- ============================================================

-- ============================================================
-- SERVICE CATEGORIES
-- ============================================================
insert into service_categories (name, slug, icon, description, sort_order, status) values
('Software Learning', 'software-learning', 'FiCode', 'Programming & software development courses', 1, true),
('Competitive Exams', 'competitive-exams', 'FiTarget', 'Exam preparation and coaching', 2, true),
('Internship', 'internship', 'FiBriefcase', 'Industry internship programs', 3, true),
('Placement Training', 'placement-training', 'FiTrendingUp', 'Job placement preparation programs', 4, true),
('Certification', 'certification', 'FiAward', 'Professional certification courses', 5, true),
('Career Services', 'career-services', 'FiStar', 'Career guidance and support services', 6, true),
('Corporate Training', 'corporate-training', 'FiUsers', 'Corporate employee training programs', 7, true),
('Others', 'others', 'FiLayers', 'Other specialized training programs', 8, true)
on conflict (slug) do nothing;

-- ============================================================
-- SERVICES
-- ============================================================
insert into services (title, slug, category_id, icon, short_description, description, duration, mode, price, discount, badge, difficulty, language, certificate, placement_support, internship, eligibility, curriculum, learning_outcomes, requirements, highlights, featured, popular, trending, status, sort_order)
values
(
  'Internship Programs',
  'internship-programs',
  (select id from service_categories where slug = 'internship'),
  'FiBriefcase',
  'Gain real-world experience with our industry-focused internship programs. Work on live projects under expert mentorship.',
  'Our internship programs bridge the gap between academic learning and industry requirements. Students work on real-world projects, gain hands-on experience, and build a professional portfolio. Interns are mentored by industry experts and receive regular feedback to accelerate their learning. Successful interns receive a completion certificate and placement assistance.',
  '3-6 Months',
  'Hybrid',
  14999, 20, 'Popular', 'All Levels', 'English', true, true, true,
  'Students currently enrolled in or graduated from any degree program. Basic understanding of relevant field preferred but not mandatory.',
  '[{"title":"Orientation & Onboarding","items":["Company introduction","Team allocation","Goal setting","Tools & access setup"]},{"title":"Training Period","items":["Domain training","Tool & technology training","Process familiarization","Mentor assignment"]},{"title":"Project Work","items":["Live project assignment","Sprint planning","Code reviews","Client interactions"]},{"title":"Assessment & Feedback","items":["Mid-term review","Performance evaluation","Feedback sessions","Final presentation"]},{"title":"Completion","items":["Certificate issuance","Letter of recommendation","Placement support","Alumni network access"]}]',
  '["Real-world project experience","Industry mentorship","Professional portfolio","Completion certificate","Placement assistance","Networking opportunities","Stipend for eligible interns","Letter of recommendation"]',
  '["Currently pursuing or completed graduation","Basic knowledge of relevant domain","Strong communication skills","Commitment of minimum 3 months"]',
  '["Live project work","Expert mentorship","Flexible timings","Work-from-home option","Stipend available","Certificate on completion"]',
  true, true, true, 'published', 1
),
(
  'Certification Courses',
  'certification-courses',
  (select id from service_categories where slug = 'certification'),
  'FiAward',
  'Industry-recognized certification programs to validate your skills and boost your career prospects.',
  'Our certification courses are designed to validate your expertise in specific domains. Each course includes comprehensive training, hands-on projects, and a final assessment. Upon successful completion, you receive a certification that is recognized by leading companies. The curriculum is regularly updated to align with industry standards and the latest technologies.',
  '2-6 Months',
  'Online',
  19999, 15, 'Trending', 'Intermediate', 'English', true, true, false,
  'Basic understanding of the subject area. Prior experience or completion of foundational course recommended.',
  '[{"title":"Foundation","items":["Core concepts","Industry overview","Tools setup","Basic terminology"]},{"title":"Core Modules","items":["Advanced concepts","Practical applications","Case studies","Best practices"]},{"title":"Specialization","items":["Domain-specific topics","Advanced techniques","Real-world scenarios","Expert sessions"]},{"title":"Assessment","items":["Practice tests","Final assessment","Project submission","Viva voce"]},{"title":"Certification","items":["Certificate issuance","Digital badge","Portfolio addition","LinkedIn integration"]}]',
  '["Industry-recognized certification","Comprehensive curriculum","Hands-on projects","Expert instruction","Lifetime access to materials","Community access","Career guidance","Resume building support"]',
  '["Basic knowledge of domain","Access to a computer with internet","Commitment to complete the program","English proficiency"]',
  '["Industry recognized","Expert instructors","Flexible schedule","Project-based learning","Career support","Lifetime access"]',
  true, true, true, 'published', 2
),
(
  'Online Classes',
  'online-classes',
  (select id from service_categories where slug = 'software-learning'),
  'FiVideo',
  'Learn from anywhere with our interactive online classes. Live sessions, recorded lectures, and hands-on assignments.',
  'Our online classes offer the flexibility to learn from anywhere while maintaining the quality of classroom training. Each course features live interactive sessions with industry experts, recorded lectures for revision, hands-on assignments, and real-time doubt clearing. Our learning management system tracks your progress and provides personalized recommendations.',
  '1-6 Months',
  'Online',
  9999, 10, 'New', 'All Levels', 'English', true, false, false,
  'Anyone with a passion to learn. No strict prerequisites for beginner courses. Intermediate/advanced levels may require foundational knowledge.',
  '[{"title":"Orientation","items":["Platform overview","Course structure","Schedule & milestones","Tools installation"]},{"title":"Interactive Sessions","items":["Live lectures","Q&A sessions","Group discussions","Screen sharing"]},{"title":"Assignments","items":["Weekly assignments","Projects","Peer reviews","Instructor feedback"]},{"title":"Assessment","items":["Quizzes","Mid-term exam","Final project","Presentation"]},{"title":"Completion","items":["Certificate","Course review","Next steps","Alumni access"]}]',
  '["Learn from anywhere","Live interactive sessions","Recorded lectures","Hands-on assignments","Doubt clearing sessions","Progress tracking","Certificate on completion","Flexible schedule"]',
  '["Stable internet connection","Computer/laptop with webcam","Basic computer literacy","Commitment to attend live sessions"]',
  '["Learn from anywhere","Live instruction","Recorded backup","Hands-on practice","Doubt clearing","Certificate included"]',
  true, false, false, 'published', 3
),
(
  'Offline Classes',
  'offline-classes',
  (select id from service_categories where slug = 'software-learning'),
  'FiMap',
  'Classroom training at our state-of-the-art facility. Face-to-face interaction with instructors and peers.',
  'Our offline classes provide an immersive learning experience at our modern training facility. Students benefit from direct face-to-face interaction with expert instructors, collaborative learning with peers, and access to our computer labs and library. Regular workshops, hackathons, and networking events complement the structured curriculum.',
  '1-6 Months',
  'Offline',
  14999, 5, '', 'All Levels', 'English', true, false, false,
  'Anyone can join. Basic educational qualification as per course requirement.',
  '[{"title":"Foundation","items":["Classroom introduction","Course overview","Materials distribution","Lab setup"]},{"title":"Core Learning","items":["Instructor-led sessions","Lab practice","Group activities","Workshops"]},{"title":"Projects","items":["Lab assignments","Mini projects","Team projects","Presentations"]},{"title":"Assessment","items":["Unit tests","Practical exams","Final project","Viva"]},{"title":"Completion","items":["Certificate distribution","Placement briefing","Alumni registration","Course feedback"]}]',
  '["Face-to-face instruction","Campus access","Lab facilities","Peer learning","Networking events","Workshops & hackathons","Library access","Placement support"]',
  '["Willingness to attend classes at our campus","Basic educational qualification","Valid ID proof","Commitment to attendance"]',
  '["Campus-based learning","Direct instructor access","Lab facilities","Peer collaboration","Networking events","Placement support"]',
  false, false, false, 'published', 4
),
(
  'Placement Training',
  'placement-training',
  (select id from service_categories where slug = 'placement-training'),
  'FiTrendingUp',
  'Comprehensive placement preparation program covering aptitude, soft skills, technical interviews, and more.',
  'Our placement training program is designed to make you job-ready. We cover everything from aptitude testing and technical interview preparation to soft skills and group discussions. Our trainers have years of industry experience and provide personalized attention to each student. Regular mock interviews simulate the actual interview environment.',
  '2-4 Months',
  'Hybrid',
  12999, 25, 'Popular', 'All Levels', 'English', false, true, false,
  'Final year students or recent graduates. Basic knowledge of your domain is required.',
  '[{"title":"Self Assessment","items":["Skill gap analysis","Goal setting","Industry awareness","Career counseling"]},{"title":"Aptitude Training","items":["Quantitative aptitude","Logical reasoning","Verbal ability","Data interpretation"]},{"title":"Technical Training","items":["Domain preparation","Core concepts","Coding practice","Industry tools"]},{"title":"Soft Skills","items":["Communication skills","Group discussions","Presentation skills","Email etiquette"]},{"title":"Interview Preparation","items":["Resume building","Mock interviews","HR interview prep","Salary negotiation"]},{"title":"Placement Support","items":["Company applications","Drive coordination","Offer assistance","Follow-up support"]}]',
  '["Job-ready skills","Mock interviews","Resume building","Aptitude mastery","Technical preparation","Soft skills enhancement","Company referrals","Placement assistance"]',
  '["Final year student or recent graduate","Basic domain knowledge","Willingness to learn","Commitment to the program"]',
  '["Mock interviews","Personalized coaching","Company-specific prep","Resume review","Group discussion practice","Placement support"]',
  true, true, false, 'published', 5
),
(
  'Mock Interviews',
  'mock-interviews',
  (select id from service_categories where slug = 'placement-training'),
  'FiMessageCircle',
  'Practice interviews with industry experts to build confidence and ace your real interviews.',
  'Our mock interview program simulates real interview scenarios to help you prepare effectively. Industry professionals conduct one-on-one mock interviews, provide detailed feedback, and share tips to improve your performance. Each session is tailored to your target role and company.',
  '1 Month',
  'Online',
  4999, 0, '', 'All Levels', 'English', false, false, false,
  'Job seekers preparing for interviews. Relevant experience or education in the target domain.',
  '[{"title":"Interview Basics","items":["Interview formats","Common questions","Company research","Dos and donts"]},{"title":"Technical Rounds","items":["Domain questions","Problem solving","Coding challenges","System design"]},{"title":"HR Rounds","items":["Behavioral questions","STAR technique","Salary discussion","Role alignment"]},{"title":"Mock Sessions","items":["Full-length mocks","Panel interviews","Video interviews","Stress interviews"]},{"title":"Feedback & Improvement","items":["Detailed feedback","Performance report","Improvement plan","Follow-up session"]}]',
  '["Real interview experience","Industry expert feedback","Personalized improvement plan","Confidence building","Multiple interview formats","Flexible scheduling","Performance tracking","Company-specific preparation"]',
  '["Active job seekers","Relevant domain knowledge","Resume ready","Willingness to receive feedback"]',
  '["Industry expert mock interviews","Detailed feedback","Flexible scheduling","Company-specific prep","Performance tracking"]',
  false, false, false, 'published', 6
),
(
  'Aptitude Training',
  'aptitude-training',
  (select id from service_categories where slug = 'placement-training'),
  'FiBarChart2',
  'Master quantitative aptitude, logical reasoning, and verbal ability for competitive exams and placements.',
  'Our aptitude training program covers all aspects of aptitude testing including quantitative aptitude, logical reasoning, verbal ability, and data interpretation. We use a structured approach with concept sessions, practice drills, and full-length mock tests to ensure comprehensive preparation.',
  '2-3 Months',
  'Hybrid',
  7999, 10, '', 'Beginner', 'English', false, false, false,
  'Anyone preparing for competitive exams or placement tests. Basic mathematics knowledge at 10+2 level.',
  '[{"title":"Quantitative Aptitude","items":["Number systems","Percentage & averages","Ratio & proportion","Time, speed & distance","Profit & loss","Permutation & combination"]},{"title":"Logical Reasoning","items":["Analytical reasoning","Data sufficiency","Puzzles","Syllogisms","Blood relations","Coding-decoding"]},{"title":"Verbal Ability","items":["Grammar","Vocabulary","Comprehension","Sentence correction","Para jumbles","Critical reasoning"]},{"title":"Data Interpretation","items":["Tables & charts","Graphs","Caselets","Data analysis","DI-LR combo"]},{"title":"Mock Tests","items":["Full-length tests","Sectional tests","Timed practice","Performance analysis"]}]',
  '["Strong aptitude foundation","Speed & accuracy","Test-taking strategies","Mock test practice","Performance analytics","Confidence building","Time management","Competitive edge"]',
  '["Basic mathematics knowledge","10+2 level education","Willingness to practice regularly","Access to computer/internet"]',
  '["Structured curriculum","Practice drills","Mock tests","Performance tracking","Expert instruction","Flexible schedule"]',
  false, false, false, 'published', 7
),
(
  'Corporate Training',
  'corporate-training',
  (select id from service_categories where slug = 'corporate-training'),
  'FiUsers',
  'Tailored training programs for organizations to upskill employees and boost productivity.',
  'Our corporate training programs are customized to meet the specific needs of your organization. We offer training in software development, project management, soft skills, leadership, and more. Our trainers work with your team to identify skill gaps and deliver targeted training solutions.',
  'Customizable',
  'Hybrid',
  null, null, '', 'All Levels', 'English', true, false, false,
  'Designed for organizations. Teams of any size can participate. Programs are tailored to skill levels.',
  '[{"title":"Needs Assessment","items":["Skill gap analysis","Team evaluation","Goal alignment","Custom curriculum design"]},{"title":"Training Delivery","items":["Expert-led sessions","Hands-on workshops","Case studies","Real projects"]},{"title":"Practice & Application","items":["Assignments","Team projects","Peer reviews","Implementation"]},{"title":"Assessment","items":["Progress tracking","Performance evaluation","Feedback collection","ROI measurement"]}]',
  '["Customized curriculum","Expert trainers","Flexible delivery","Team upskilling","Productivity boost","Industry best practices","Certification","Post-training support"]',
  '["Organization with training needs","Team availability","Infrastructure for training","Management commitment"]',
  '["Customized programs","Expert trainers","Flexible delivery modes","Hands-on approach","Post-training support"]',
  false, false, false, 'published', 8
),
(
  'Software Development Courses',
  'software-development-courses',
  (select id from service_categories where slug = 'software-learning'),
  'FiCode',
  'Comprehensive software development courses covering modern technologies, frameworks, and best practices.',
  'Our software development courses provide end-to-end training in modern programming languages, frameworks, and tools. Whether you are a beginner or an experienced developer looking to upskill, our project-based curriculum ensures you gain practical, job-ready skills.',
  '3-6 Months',
  'Hybrid',
  24999, 20, 'Trending', 'All Levels', 'English', true, true, true,
  'Beginners welcome. Intermediate/advanced levels require basic programming knowledge.',
  '[{"title":"Programming Fundamentals","items":["Logic building","Data types & variables","Control structures","Functions & methods","OOP concepts"]},{"title":"Frontend Development","items":["HTML/CSS/JavaScript","React/Angular/Vue","Responsive design","State management","API integration"]},{"title":"Backend Development","items":["Node.js/Python/Java","Databases & SQL","REST APIs","Authentication","Deployment"]},{"title":"Full Stack Projects","items":["Architecture design","Full stack development","Testing","CI/CD","Production deployment"]},{"title":"Career Preparation","items":["Portfolio building","GitHub profile","Technical interviews","Resume review"]}]',
  '["Full-stack development skills","Real-world projects","Industry best practices","Portfolio & GitHub","Interview preparation","Certificate","Placement support","Lifetime community access"]',
  '["Computer with internet access","Basic computer literacy","Commitment to learn","English proficiency"]',
  '["Project-based learning","Industry mentors","Flexible schedule","Career support","Modern curriculum"]',
  true, true, true, 'published', 9
),
(
  'Career Guidance',
  'career-guidance',
  (select id from service_categories where slug = 'career-services'),
  'FiStar',
  'Expert career counseling and guidance to help you make informed career decisions.',
  'Our career guidance service helps students and professionals make informed decisions about their career path. Through one-on-one counseling sessions, psychometric assessments, and industry insights, we help you identify your strengths, explore opportunities, and create a roadmap for success.',
  'Customizable',
  'Online',
  4999, 0, 'New', 'All Levels', 'English', false, false, false,
  'Anyone seeking career guidance - students, graduates, or professionals looking for a career change.',
  '[{"title":"Self Discovery","items":["Psychometric assessment","Strengths analysis","Interest mapping","Personality profiling"]},{"title":"Career Exploration","items":["Industry overview","Role research","Growth trajectories","Salary benchmarks"]},{"title":"Goal Setting","items":["Short-term goals","Long-term vision","Skill roadmap","Milestone planning"]},{"title":"Action Plan","items":["Course recommendations","Skill development plan","Networking strategy","Timeline creation"]},{"title":"Follow-up","items":["Progress review","Goal adjustment","Continuous support","Alumni network"]}]',
  '["Clarity on career path","Personalized action plan","Industry insights","Confidence building","Skill gap identification","Network building","Ongoing support","Better career decisions"]',
  '["Open mind and willingness to explore","Honest self-assessment","Commitment to follow the plan"]',
  '["Personalized counseling","Psychometric assessment","Industry insights","Action plan","Follow-up support"]',
  false, false, false, 'published', 10
),
(
  'Resume Building',
  'resume-building',
  (select id from service_categories where slug = 'career-services'),
  'FiFileText',
  'Professional resume writing and optimization services to make your application stand out.',
  'Our resume building service helps you create a compelling, ATS-friendly resume that gets noticed by recruiters. Our experts work with you to highlight your achievements, skills, and experience in the most impactful way. We also provide LinkedIn profile optimization and cover letter writing services.',
  '3-7 Days',
  'Online',
  2999, 0, '', 'All Levels', 'English', false, false, false,
  'Job seekers, students, or professionals looking to improve their resume.',
  '[{"title":"Profile Analysis","items":["Current resume review","Career history analysis","Skill identification","Achievement mapping"]},{"title":"Resume Writing","items":["Professional summary","Experience optimization","Skills section","Education formatting"]},{"title":"Design & Layout","items":["ATS-friendly format","Professional design","Consistent styling","PDF optimization"]},{"title":"Review & Delivery","items":["Quality check","Multiple formats","Cover letter","LinkedIn optimization"]}]',
  '["Professional, ATS-friendly resume","LinkedIn optimization","Cover letter","Interview-ready format","Expert feedback","Quick turnaround","Multiple revisions","Format for all platforms"]',
  '["Current resume (optional)","Job target clarity","Complete career history","Honest self-assessment"]',
  '["Professional writing","ATS-optimized","Quick delivery","Multiple revisions","LinkedIn profile update","Cover letter included"]',
  false, false, false, 'published', 11
),
(
  'Soft Skills Training',
  'soft-skills-training',
  (select id from service_categories where slug = 'placement-training'),
  'FiUsers',
  'Enhance your communication, leadership, and interpersonal skills for professional success.',
  'Our soft skills training program develops essential workplace skills including communication, teamwork, leadership, time management, and emotional intelligence. Through interactive workshops, role-playing exercises, and real-world scenarios, participants build the confidence and skills needed to excel in any professional environment.',
  '1-2 Months',
  'Hybrid',
  5999, 0, '', 'All Levels', 'English', false, false, false,
  'Anyone looking to improve their professional and interpersonal skills. No prerequisites.',
  '[{"title":"Communication Skills","items":["Verbal communication","Non-verbal cues","Active listening","Presentation skills","Business writing"]},{"title":"Leadership & Teamwork","items":["Team dynamics","Conflict resolution","Negotiation skills","Delegation","Motivation"]},{"title":"Personal Effectiveness","items":["Time management","Goal setting","Stress management","Emotional intelligence","Decision making"]},{"title":"Professional Etiquette","items":["Workplace etiquette","Email etiquette","Meeting etiquette","Dress code","Cross-cultural communication"]},{"title":"Career Success","items":["Personal branding","Networking","Interview skills","Performance reviews","Growth mindset"]}]',
  '["Improved communication","Leadership skills","Time management","Emotional intelligence","Professional etiquette","Confidence building","Team collaboration","Career readiness"]',
  '["Willingness to learn and grow","Openness to feedback","Commitment to practice"]',
  '["Interactive workshops","Real-world scenarios","Expert trainers","Flexible schedule","Practical exercises"]',
  true, false, false, 'published', 12
)
on conflict (slug) do nothing;

-- ============================================================
-- SERVICE BENEFITS
-- ============================================================
-- Internship Programs
insert into service_benefits (service_id, icon, title, description, sort_order)
select id, 'FiCode', 'Real Projects', 'Work on live industry projects that add real value to your portfolio.', 1 from services where slug = 'internship-programs'
union all select id, 'FiStar', 'Expert Mentorship', 'Get guidance from experienced industry professionals throughout your internship.', 2 from services where slug = 'internship-programs'
union all select id, 'FiAward', 'Certificate', 'Receive a completion certificate and letter of recommendation upon successful completion.', 3 from services where slug = 'internship-programs'
union all select id, 'FiBriefcase', 'Placement Support', 'Get priority access to our placement programs after internship completion.', 4 from services where slug = 'internship-programs'
union all select id, 'FiUsers', 'Networking', 'Build professional connections with industry experts and fellow interns.', 5 from services where slug = 'internship-programs'
union all select id, 'FiTrendingUp', 'Stipend', 'Earn a stipend based on performance during the internship period.', 6 from services where slug = 'internship-programs';

-- Certification Courses
insert into service_benefits (service_id, icon, title, description, sort_order)
select id, 'FiAward', 'Industry Recognition', 'Get certified with credentials recognized by top companies.', 1 from services where slug = 'certification-courses'
union all select id, 'FiBookOpen', 'Comprehensive Curriculum', 'Thorough coverage of all topics with regular curriculum updates.', 2 from services where slug = 'certification-courses'
union all select id, 'FiCode', 'Hands-on Projects', 'Apply your learning through practical projects and assignments.', 3 from services where slug = 'certification-courses'
union all select id, 'FiVideo', 'Flexible Learning', 'Self-paced learning with lifetime access to course materials.', 4 from services where slug = 'certification-courses'
union all select id, 'FiUsers', 'Community Access', 'Join a community of learners and professionals for networking.', 5 from services where slug = 'certification-courses'
union all select id, 'FiBriefcase', 'Career Support', 'Get career guidance and job placement assistance post-certification.', 6 from services where slug = 'certification-courses';

-- Online Classes
insert into service_benefits (service_id, icon, title, description, sort_order)
select id, 'FiVideo', 'Live Sessions', 'Interactive live classes with real-time doubt solving.', 1 from services where slug = 'online-classes'
union all select id, 'FiClock', 'Flexible Timing', 'Learn at your own pace with recorded session backups.', 2 from services where slug = 'online-classes'
union all select id, 'FiCode', 'Hands-on Labs', 'Practice with cloud-based labs and development environments.', 3 from services where slug = 'online-classes'
union all select id, 'FiMessageCircle', 'Doubt Clearing', 'Dedicated doubt clearing sessions with instructors.', 4 from services where slug = 'online-classes'
union all select id, 'FiUsers', 'Peer Learning', 'Collaborate with fellow learners through group activities.', 5 from services where slug = 'online-classes'
union all select id, 'FiAward', 'Certificate', 'Get a course completion certificate to boost your resume.', 6 from services where slug = 'online-classes';

-- Offline Classes
insert into service_benefits (service_id, icon, title, description, sort_order)
select id, 'FiMap', 'Campus Experience', 'Learn at our state-of-the-art training facility.', 1 from services where slug = 'offline-classes'
union all select id, 'FiUsers', 'Direct Mentorship', 'Face-to-face interaction with instructors for personalized guidance.', 2 from services where slug = 'offline-classes'
union all select id, 'FiLayers', 'Lab Access', 'Access to computer labs, library, and learning resources.', 3 from services where slug = 'offline-classes'
union all select id, 'FiUsers', 'Peer Networking', 'Build lasting professional relationships with classmates.', 4 from services where slug = 'offline-classes'
union all select id, 'FiCalendar', 'Structured Schedule', 'Regular class schedule for disciplined learning.', 5 from services where slug = 'offline-classes'
union all select id, 'FiAward', 'Certificate', 'Receive a certificate of completion at campus ceremony.', 6 from services where slug = 'offline-classes';

-- Placement Training
insert into service_benefits (service_id, icon, title, description, sort_order)
select id, 'FiTrendingUp', 'Job Readiness', 'Become completely job-ready with comprehensive preparation.', 1 from services where slug = 'placement-training'
union all select id, 'FiMessageCircle', 'Mock Interviews', 'Practice with industry experts through realistic mock interviews.', 2 from services where slug = 'placement-training'
union all select id, 'FiFileText', 'Resume Building', 'Get a professional, ATS-optimized resume.', 3 from services where slug = 'placement-training'
union all select id, 'FiBarChart2', 'Aptitude Mastery', 'Master quantitative, logical, and verbal aptitude.', 4 from services where slug = 'placement-training'
union all select id, 'FiUsers', 'Soft Skills', 'Develop essential soft skills for workplace success.', 5 from services where slug = 'placement-training'
union all select id, 'FiBriefcase', 'Company Referrals', 'Get referred to our partner companies for job openings.', 6 from services where slug = 'placement-training';

-- Software Development Courses
insert into service_benefits (service_id, icon, title, description, sort_order)
select id, 'FiCode', 'Full Stack Skills', 'Learn both frontend and backend development with modern technologies.', 1 from services where slug = 'software-development-courses'
union all select id, 'FiLayers', 'Project Portfolio', 'Build a strong portfolio with real-world projects.', 2 from services where slug = 'software-development-courses'
union all select id, 'FiStar', 'Industry Mentors', 'Learn from experienced software developers and engineers.', 3 from services where slug = 'software-development-courses'
union all select id, 'FiBriefcase', 'Career Support', 'Get help with job placement and interview preparation.', 4 from services where slug = 'software-development-courses'
union all select id, 'FiAward', 'Certification', 'Earn a full-stack development certificate.', 5 from services where slug = 'software-development-courses'
union all select id, 'FiUsers', 'Community', 'Join our developer community for ongoing support and networking.', 6 from services where slug = 'software-development-courses';

-- ============================================================
-- SERVICE STEPS (Timeline)
-- ============================================================
-- Internship Programs
insert into service_steps (service_id, title, description, icon, step_order)
select id, 'Enroll', 'Submit your application and complete the enrollment process.', 'FiEdit', 1 from services where slug = 'internship-programs'
union all select id, 'Orientation', 'Attend orientation to understand company culture and expectations.', 'FiInfo', 2 from services where slug = 'internship-programs'
union all select id, 'Training', 'Receive domain-specific training and tool familiarization.', 'FiBookOpen', 3 from services where slug = 'internship-programs'
union all select id, 'Project Work', 'Work on live projects under expert mentorship.', 'FiCode', 4 from services where slug = 'internship-programs'
union all select id, 'Assessment', 'Regular performance reviews and feedback sessions.', 'FiBarChart2', 5 from services where slug = 'internship-programs'
union all select id, 'Completion', 'Receive certificate and placement support.', 'FiAward', 6 from services where slug = 'internship-programs';

-- Certification Courses
insert into service_steps (service_id, title, description, icon, step_order)
select id, 'Enroll', 'Sign up for your chosen certification program.', 'FiEdit', 1 from services where slug = 'certification-courses'
union all select id, 'Learn', 'Access course materials and learn at your own pace.', 'FiBookOpen', 2 from services where slug = 'certification-courses'
union all select id, 'Practice', 'Complete hands-on assignments and projects.', 'FiCode', 3 from services where slug = 'certification-courses'
union all select id, 'Assess', 'Take tests and submit your final project.', 'FiBarChart2', 4 from services where slug = 'certification-courses'
union all select id, 'Certify', 'Earn your industry-recognized certification.', 'FiAward', 5 from services where slug = 'certification-courses'
union all select id, 'Succeed', 'Leverage your certification for career growth.', 'FiTrendingUp', 6 from services where slug = 'certification-courses';

-- Software Development Courses
insert into service_steps (service_id, title, description, icon, step_order)
select id, 'Enroll', 'Choose your course and complete registration.', 'FiEdit', 1 from services where slug = 'software-development-courses'
union all select id, 'Learn Fundamentals', 'Master programming basics and core concepts.', 'FiBookOpen', 2 from services where slug = 'software-development-courses'
union all select id, 'Build Projects', 'Apply your skills to build real-world applications.', 'FiCode', 3 from services where slug = 'software-development-courses'
union all select id, 'Specialize', 'Dive deep into your chosen technology stack.', 'FiLayers', 4 from services where slug = 'software-development-courses'
union all select id, 'Get Certified', 'Complete assessments and earn your certificate.', 'FiAward', 5 from services where slug = 'software-development-courses'
union all select id, 'Start Career', 'Get placement support and start your dev career.', 'FiBriefcase', 6 from services where slug = 'software-development-courses';

-- ============================================================
-- SERVICE TESTIMONIALS
-- ============================================================
insert into service_testimonials (service_id, student_name, course, company, rating, review, sort_order)
select id, 'Priya Sharma', 'Full Stack Development', 'TechSolutions Pvt Ltd', 5, 'The internship program gave me hands-on experience with real projects. I was able to build a strong portfolio and got placed at a top tech company. The mentors were incredibly supportive throughout the journey.', 1 from services where slug = 'internship-programs'
union all select id, 'Rahul Verma', 'Data Science', 'DataCraft Analytics', 5, 'The certification course was comprehensive and well-structured. The projects helped me understand real-world applications. I highly recommend this program to anyone looking to upskill.', 1 from services where slug = 'certification-courses'
union all select id, 'Ananya Gupta', 'Web Development', 'WebWorks Agency', 4, 'The online classes were very interactive and the recorded sessions helped me revise concepts at my own pace. The placement support was excellent!', 1 from services where slug = 'online-classes'
union all select id, 'Vikram Singh', 'Placement Training', 'GlobalTech Systems', 5, 'The placement training program transformed my approach to job interviews. The mock interviews were incredibly realistic and the feedback helped me improve significantly. I landed my dream job!', 1 from services where slug = 'placement-training'
union all select id, 'Neha Patel', 'Software Development', 'InnoSoft Solutions', 5, 'The software development course was exactly what I needed to transition into tech. The project-based approach and mentorship were outstanding. Got placed before completing the course!', 1 from services where slug = 'software-development-courses';

-- ============================================================
-- SERVICE STATISTICS
-- ============================================================
insert into service_statistics (service_id, title, value, icon, sort_order)
select id, 'Students Trained', '5,000+', 'FiUsers', 1 from services where slug = 'software-development-courses'
union all select id, 'Placements', '3,500+', 'FiBriefcase', 2 from services where slug = 'software-development-courses'
union all select id, 'Projects Built', '10,000+', 'FiCode', 3 from services where slug = 'software-development-courses'
union all select id, 'Companies', '500+', 'FiGlobe', 4 from services where slug = 'software-development-courses'
union all select id, 'Certifications', '4,500+', 'FiAward', 5 from services where slug = 'software-development-courses'
union all select id, 'Avg Package', '8.5 LPA', 'FiTrendingUp', 6 from services where slug = 'software-development-courses';

-- ============================================================
-- SERVICE FAQS
-- ============================================================
insert into service_faqs (service_id, question, answer, sort_order, is_active, category)
select id, 'What is the duration of the internship?', 'Our internship programs typically run for 3-6 months depending on the domain and project requirements. We also offer flexible durations for students with academic commitments.', 1, true, 'Program Details' from services where slug = 'internship-programs'
union all select id, 'Is there any stipend?', 'Yes, eligible interns receive a performance-based stipend. The stipend amount varies based on the role, duration, and performance.', 2, true, 'Compensation' from services where slug = 'internship-programs'
union all select id, 'Will I get a certificate?', 'Yes, upon successful completion of the internship, you will receive a certificate and a letter of recommendation.', 3, true, 'Completion' from services where slug = 'internship-programs'
union all select id, 'Is there placement support after internship?', 'Absolutely! Our top-performing interns get priority access to our placement programs and are referred to our partner companies.', 4, true, 'Placement' from services where slug = 'internship-programs'
union all select id, 'What if I miss a live class?', 'All live sessions are recorded and made available in your learning dashboard. You can access them anytime for revision.', 1, true, 'Classes' from services where slug = 'online-classes'
union all select id, 'How are the doubts cleared?', 'We have dedicated doubt-clearing sessions after each class. You can also post your doubts on our learning platform and get responses within 24 hours.', 2, true, 'Support' from services where slug = 'online-classes'
union all select id, 'Is the certification valid?', 'Yes, our certifications are recognized by industry partners and can be added to your LinkedIn profile and resume.', 1, true, 'Certification' from services where slug = 'certification-courses'
union all select id, 'What companies have hired from Marvel Slice?', 'Our students have been placed at 500+ companies including TCS, Infosys, Wipro, Accenture, Amazon, Flipkart, and many more.', 1, true, 'Placement' from services where slug = 'placement-training';

-- ============================================================
-- SERVICE GALLERY
-- ============================================================
insert into service_gallery (service_id, image, caption, type, sort_order) values
((select id from services where slug = 'internship-programs'), 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800', 'Team Collaboration', 'image', 1),
((select id from services where slug = 'internship-programs'), 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', 'Mentorship Session', 'image', 2),
((select id from services where slug = 'internship-programs'), 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800', 'Office Workspace', 'image', 3),
((select id from services where slug = 'software-development-courses'), 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800', 'Coding Lab', 'image', 1),
((select id from services where slug = 'software-development-courses'), 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800', 'Developer Workspace', 'image', 2),
((select id from services where slug = 'software-development-courses'), 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800', 'Code Review Session', 'image', 3);
