-- ============================================================
-- MARVEL SLICE — TRAINING SEED DATA
-- Run in Supabase SQL Editor AFTER training-schema.sql
-- ============================================================

-- TRAINING CATEGORIES
insert into training_categories (name, slug, icon, description, sort_order, status) values
('Student Development', 'student-development', 'FiUsers', 'Holistic development programs for students', 1, true),
('Placement Training', 'placement-training', 'FiTrendingUp', 'Job placement preparation programs', 2, true),
('Communication Skills', 'communication-skills', 'FiMessageCircle', 'Enhance verbal and written communication', 3, true),
('Soft Skills', 'soft-skills', 'FiHeart', 'Essential soft skills for professional success', 4, true),
('Career Development', 'career-development', 'FiStar', 'Career planning and growth programs', 5, true),
('Interview Preparation', 'interview-preparation', 'FiTarget', 'Complete interview readiness training', 6, true),
('Corporate Skills', 'corporate-skills', 'FiBriefcase', 'Skills needed in corporate environments', 7, true),
('Professional Development', 'professional-development', 'FiAward', 'Professional skill enhancement programs', 8, true),
('Personality Development', 'personality-development', 'FiZap', 'Build confidence and personality', 9, true),
('Leadership Training', 'leadership-training', 'FiGlobe', 'Leadership and management skills', 10, true)
on conflict (slug) do nothing;

-- TRAINING PROGRAMS
insert into training_programs (title, slug, category_id, icon, short_description, description, duration, mode, difficulty, badge, featured, popular, trending, status, sort_order, certificate, eligibility, learning_outcomes, modules, benefits, skills, placement_support, assessment)
values
(
  'Student Skill Development',
  'student-skill-development',
  (select id from training_categories where slug = 'student-development'),
  'FiUsers',
  'Comprehensive skill development program designed to prepare students for academic and professional success.',
  'Our Student Skill Development program bridges the gap between academic learning and industry expectations. Through a structured approach, students develop essential skills including communication, leadership, problem-solving, and workplace readiness. The program combines interactive workshops, real-world projects, and personalized mentoring.',
  '3 Months', 'Hybrid', 'Beginner', 'Popular', true, true, true, 'published', 1, true,
  'High school and college students looking to build foundational professional skills.',
  '["Enhanced communication skills","Leadership abilities","Problem-solving mindset","Workplace readiness","Confidence building","Team collaboration skills","Time management mastery","Professional etiquette"]',
  '[{"title":"Foundation Skills","duration":"2 weeks","topics":["Self-assessment","Goal setting","Learning styles","Time management basics"],"outcomes":"Understand personal strengths and areas for improvement"},{"title":"Communication Basics","duration":"3 weeks","topics":["Verbal communication","Active listening","Non-verbal cues","Presentation fundamentals"],"outcomes":"Communicate effectively in academic and professional settings"},{"title":"Teamwork & Collaboration","duration":"2 weeks","topics":["Team dynamics","Role assignment","Conflict resolution","Collaborative tools"],"outcomes":"Work effectively in team environments"},{"title":"Problem Solving","duration":"3 weeks","topics":["Critical thinking","Analytical skills","Decision frameworks","Creative solutions"],"outcomes":"Apply structured problem-solving approaches"}]',
  '["Expert trainers","Interactive workshops","Real-world projects","Personalized feedback","Certificate on completion","Career guidance","Peer networking","Lifetime access to materials"]',
  '["Professional Communication","Leadership","Confidence Building","Presentation Skills","Interview Confidence","Resume Writing","Team Collaboration","Problem Solving"]',
  'Get priority access to our placement preparation programs upon successful completion.',
  'Weekly quizzes, mid-term project, final presentation, participation evaluation'
),
(
  'Communication Skills',
  'communication-skills',
  (select id from training_categories where slug = 'communication-skills'),
  'FiMessageCircle',
  'Master the art of effective communication for professional and personal success.',
  'Effective communication is the cornerstone of professional success. This program covers verbal, non-verbal, written, and digital communication skills. Through practical exercises, role-playing, and real-world scenarios, participants develop the confidence and clarity needed to communicate effectively in any situation.',
  '2 Months', 'Hybrid', 'Beginner', 'Best Seller', true, true, true, 'published', 2, true,
  'Anyone looking to improve their communication skills. No prerequisites.',
  '["Clear verbal expression","Active listening skills","Professional writing ability","Presentation confidence","Persuasive communication","Cross-cultural sensitivity","Digital communication etiquette","Public speaking basics"]',
  '[{"title":"Fundamentals of Communication","duration":"1 week","topics":["Communication process","Barriers to communication","Communication styles","Self-assessment"],"outcomes":"Understand personal communication style and areas for growth"},{"title":"Verbal Communication","duration":"3 weeks","topics":["Tone and clarity","Vocabulary building","Articulation","Conversation skills","Negotiation basics"],"outcomes":"Speak clearly and confidently in professional settings"},{"title":"Non-Verbal Communication","duration":"1 week","topics":["Body language","Eye contact","Posture and gestures","Facial expressions"],"outcomes":"Align non-verbal cues with verbal messages"},{"title":"Written Communication","duration":"2 weeks","topics":["Email etiquette","Business writing","Report writing","Professional messaging"],"outcomes":"Write clear, professional emails and documents"},{"title":"Presentation Skills","duration":"3 weeks","topics":["Structuring presentations","Visual aids","Audience engagement","Handling Q&A"],"outcomes":"Deliver confident and engaging presentations"}]',
  '["Expert communication coaches","Role-playing exercises","Video feedback sessions","Real-world scenarios","Personal improvement plan","Certificate on completion","Practice labs","Peer feedback"]',
  '["Professional Communication","Active Listening","Presentation Skills","Business Writing","Public Speaking","Persuasion","Negotiation","Cross-cultural Communication"]',
  'Strong communication skills enhance placement prospects. Our students receive preference from partner companies.',
  'Communication assessments, presentation projects, written assignments, peer evaluations'
),
(
  'Soft Skills Development',
  'soft-skills-development',
  (select id from training_categories where slug = 'soft-skills'),
  'FiHeart',
  'Develop essential soft skills that employers value most for career success.',
  'Soft skills are the differentiator in today competitive job market. This program focuses on developing interpersonal skills, emotional intelligence, adaptability, and professional behavior. Participants engage in interactive sessions, group activities, and self-reflection exercises to build these critical competencies.',
  '2 Months', 'Hybrid', 'Beginner', 'Popular', true, false, true, 'published', 3, true,
  'Open to all. Ideal for students and professionals seeking to enhance their interpersonal skills.',
  '["Emotional intelligence","Adaptability and resilience","Professional relationships","Conflict resolution","Empathy and understanding","Positive mindset","Stress management","Workplace professionalism"]',
  '[{"title":"Understanding Soft Skills","duration":"1 week","topics":["What are soft skills","Why they matter","Self-assessment","Personal development plan"],"outcomes":"Identify key soft skills and personal development areas"},{"title":"Emotional Intelligence","duration":"3 weeks","topics":["Self-awareness","Self-regulation","Motivation","Empathy","Social skills"],"outcomes":"Develop emotional intelligence for professional success"},{"title":"Interpersonal Skills","duration":"3 weeks","topics":["Building rapport","Active listening","Feedback giving and receiving","Networking"],"outcomes":"Build strong professional relationships"},{"title":"Professional Behavior","duration":"2 weeks","topics":["Workplace ethics","Professionalism","Accountability","Positive attitude"],"outcomes":"Demonstrate professional behavior in workplace settings"}]',
  '["Industry experts","Interactive workshops","Self-assessment tools","Personal coaching","Group activities","Progress tracking","Certificate","Career support"]',
  '["Emotional Intelligence","Adaptability","Professional Ethics","Positive Mindset","Stress Management","Conflict Resolution","Empathy","Interpersonal Skills"]',
  'Soft skills training significantly improves placement success. We provide preference to our trained students.',
  'Self-assessments, group activities, role-play evaluations, final project presentation'
),
(
  'Placement Preparation',
  'placement-preparation',
  (select id from training_categories where slug = 'placement-training'),
  'FiTrendingUp',
  'Complete placement preparation program covering aptitude, interviews, and professional skills.',
  'Our comprehensive Placement Preparation program is designed to make you job-ready. From aptitude training and technical preparation to mock interviews and soft skills, every aspect of the placement process is covered. Industry experts provide personalized guidance to help you land your dream job.',
  '3 Months', 'Hybrid', 'Intermediate', 'Best Seller', true, true, true, 'published', 4, true,
  'Final year students and recent graduates preparing for campus placements and job interviews.',
  '["Crack any aptitude test","Excel in group discussions","Ace technical interviews","Master HR interviews","Build a standout resume","Confident presentation","Professional networking","Job search strategies"]',
  '[{"title":"Aptitude Training","duration":"4 weeks","topics":["Quantitative aptitude","Logical reasoning","Verbal ability","Data interpretation"],"outcomes":"Solve aptitude questions with speed and accuracy"},{"title":"Technical Preparation","duration":"3 weeks","topics":["Core subject review","Industry-specific prep","Coding practice","Technical problem solving"],"outcomes":"Answer technical questions confidently"},{"title":"Soft Skills for Placement","duration":"2 weeks","topics":["Group discussion","Presentation skills","Professional etiquette","Confidence building"],"outcomes":"Excel in group activities and presentations"},{"title":"Interview Preparation","duration":"3 weeks","topics":["Resume building","Mock interviews","HR interview prep","Salary negotiation"],"outcomes":"Perform excellently in interviews"},{"title":"Placement Strategy","duration":"2 weeks","topics":["Company research","Application strategy","Follow-up etiquette","Offer evaluation"],"outcomes":"Navigate the placement process effectively"}]',
  '["Expert trainers","Mock interviews","Resume review","Aptitude practice","Company-specific prep","Group discussion practice","Placement support","Certificate"]',
  '["Interview Confidence","Resume Writing","Aptitude Mastery","Group Discussion","Technical Knowledge","Professional Communication","Presentation Skills","Job Search Strategy"]',
  'Direct placement support with 500+ partner companies. Resume referrals and interview coordination provided.',
  'Weekly mock tests, group discussion evaluations, mock interview rounds, final assessment'
),
(
  'Interview Skills',
  'interview-skills',
  (select id from training_categories where slug = 'interview-preparation'),
  'FiTarget',
  'Master interview techniques and build the confidence to ace any job interview.',
  'This focused program covers every aspect of interview preparation. From understanding interview formats to handling tricky questions, participants gain the skills and confidence needed to make a lasting impression. Multiple mock interview rounds with detailed feedback ensure continuous improvement.',
  '1 Month', 'Online', 'Intermediate', 'Popular', true, false, false, 'published', 5, false,
  'Job seekers and students preparing for upcoming interviews.',
  '["Understand interview formats","Answer questions confidently","Handle pressure situations","Build instant rapport","Showcase achievements effectively","Negotiate offers","Follow up professionally","Make lasting impression"]',
  '[{"title":"Interview Fundamentals","duration":"1 week","topics":["Types of interviews","Common questions","Research and preparation","First impressions"],"outcomes":"Understand different interview formats and prepare accordingly"},{"title":"Answering Techniques","duration":"2 weeks","topics":["STAR technique","Behavioral questions","Technical questions","Case interviews"],"outcomes":"Structure answers effectively using proven techniques"},{"title":"Mock Interviews","duration":"1 week","topics":["Full-length mocks","Panel interviews","Video interviews","Stress interviews"],"outcomes":"Gain confidence through realistic interview practice"}]',
  '["Industry experts as interviewers","Realistic mock interviews","Detailed feedback","Personalized improvement plan","Flexible scheduling","Multiple interview formats","Performance tracking","Confidence building"]',
  '["Interview Confidence","STAR Technique","Behavioral Answers","Technical Responses","Salary Negotiation","Professional Presence","Quick Thinking","Stress Management"]',
  'Interview-ready candidates get priority referrals to our partner companies.',
  'Multiple mock interview rounds with detailed scoring and feedback'
),
(
  'Resume Building',
  'resume-building',
  (select id from training_categories where slug = 'career-development'),
  'FiFileText',
  'Create a powerful, ATS-friendly resume that gets you noticed by recruiters.',
  'Your resume is your first impression. This program teaches you how to create a compelling resume that stands out. From formatting and content to ATS optimization and LinkedIn alignment, every aspect of professional resume writing is covered with personalized guidance.',
  '2 Weeks', 'Online', 'Beginner', 'New', false, true, true, 'published', 6, false,
  'Job seekers, students, and professionals looking to improve their resume and LinkedIn profile.',
  '["Create ATS-optimized resume","Write compelling summaries","Highlight achievements effectively","Optimize LinkedIn profile","Tailor resumes for each job","Format professionally","Include keywords strategically","Build cover letters"]',
  '[{"title":"Resume Fundamentals","duration":"3 days","topics":["Resume types and formats","Key sections","Industry expectations","ATS basics"],"outcomes":"Understand resume fundamentals and ATS requirements"},{"title":"Content Development","duration":"5 days","topics":["Professional summary","Experience descriptions","Achievement statements","Skills section"],"outcomes":"Write compelling, achievement-oriented content"},{"title":"Design & Optimization","duration":"3 days","topics":["Formatting and design","ATS optimization","Keyword strategies","LinkedIn alignment"],"outcomes":"Create visually appealing, ATS-compliant resumes"},{"title":"Review & Refine","duration":"3 days","topics":["Peer review","Expert feedback","Final polish","Cover letter writing"],"outcomes":"Deliver a polished, interview-winning resume"}]',
  '["Professional resume writers","ATS optimization","LinkedIn profile review","Cover letter included","Multiple revisions","Quick turnaround","Industry-specific templates","Personal consultation"]',
  '["Resume Writing","ATS Optimization","LinkedIn Profile","Cover Letter Writing","Personal Branding","Achievement Highlighting","Professional Formatting","Keyword Strategy"]',
  'An optimized resume increases interview calls by 60%. We refer well-prepared candidates to hiring partners.',
  'Final resume submission and review, LinkedIn profile assessment'
),
(
  'Aptitude Training',
  'aptitude-training',
  (select id from training_categories where slug = 'placement-training'),
  'FiBarChart2',
  'Comprehensive aptitude training to crack placement tests and competitive exams.',
  'Master quantitative aptitude, logical reasoning, and verbal ability through our structured training program. With concept sessions, practice drills, and full-length mock tests, students build speed and accuracy. Personalized performance tracking identifies weak areas for focused improvement.',
  '2 Months', 'Hybrid', 'Intermediate', 'Popular', false, true, false, 'published', 7, false,
  'Students preparing for placement tests, competitive exams, or aptitude assessments.',
  '["Master quantitative aptitude","Excel in logical reasoning","Improve verbal ability","Solve data interpretation","Build calculation speed","Develop test strategy","Manage time effectively","Analyze performance"]',
  '[{"title":"Quantitative Aptitude","duration":"3 weeks","topics":["Number systems","Percentages","Averages","Ratio proportion","Time speed distance","Profit loss"]},{"title":"Logical Reasoning","duration":"2 weeks","topics":["Analytical reasoning","Data sufficiency","Puzzles and sequences","Syllogisms","Blood relations"]},{"title":"Verbal Ability","duration":"2 weeks","topics":["Grammar","Vocabulary","Reading comprehension","Sentence correction","Critical reasoning"]},{"title":"Mock Tests & Strategy","duration":"1 week","topics":["Full-length tests","Time management","Error analysis","Speed improvement"]}]',
  '["Expert faculty","Concept sessions","Practice drills","Mock tests","Performance analytics","Doubt clearing","Study materials","Progress tracking"]',
  '["Quantitative Aptitude","Logical Reasoning","Data Interpretation","Verbal Ability","Time Management","Test Strategy","Speed Calculation","Error Analysis"]',
  'Strong aptitude scores open doors to top companies. We help students achieve 90%+ accuracy.',
  'Weekly sectional tests, full-length mock tests, performance analysis reports'
),
(
  'Group Discussion Training',
  'group-discussion-training',
  (select id from training_categories where slug = 'interview-preparation'),
  'FiUsers',
  'Master the art of group discussion with confidence, structure, and impact.',
  'Group discussions are a critical part of the selection process. This program trains participants to express ideas clearly, listen actively, and contribute meaningfully in group settings. Through multiple practice sessions with expert feedback, participants develop the skills to stand out in any group discussion.',
  '3 Weeks', 'Online', 'Beginner', '', false, false, false, 'published', 8, false,
  'Students and professionals preparing for group discussions in placements or admissions.',
  '["Initiate discussions confidently","Structure arguments logically","Listen and respond effectively","Handle counterpoints","Demonstrate leadership","Manage time in discussions","Summarize effectively","Build consensus"]',
  '[{"title":"GD Fundamentals","duration":"1 week","topics":["GD formats and expectations","Key skills assessed","Common topics","Preparation strategy"],"outcomes":"Understand GD evaluation criteria"},{"title":"Speaking & Listening","duration":"1 week","topics":["Idea articulation","Active listening","Building on others points","Polite disagreement"],"outcomes":"Communicate effectively in group settings"},{"title":"Practice Sessions","duration":"1 week","topics":["Mock GDs","Peer feedback","Expert evaluation","Improvement plan"],"outcomes":"Demonstrate confident GD performance"}]',
  '["Expert facilitators","Multiple practice sessions","Video recordings","Detailed feedback","Peer learning","Real-world topics","Performance tracking","Certificate"]',
  '["Group Discussion","Active Listening","Articulation","Leadership","Time Management","Consensus Building","Critical Thinking","Confidence"]',
  'Strong GD skills improve placement and admission success rates significantly.',
  'Multiple mock GD sessions with expert evaluation and feedback reports'
),
(
  'Personality Development',
  'personality-development',
  (select id from training_categories where slug = 'personality-development'),
  'FiZap',
  'Transform your personality to make a powerful and lasting impression in every situation.',
  'Personality development goes beyond external appearance. This program focuses on holistic growth including confidence building, communication style, attitude, and professional presence. Through self-awareness exercises, practical activities, and personalized coaching, participants unlock their full potential.',
  '2 Months', 'Hybrid', 'Beginner', 'Popular', false, false, true, 'published', 9, true,
  'Anyone looking to enhance their personality and build greater self-confidence.',
  '["Build unshakable confidence","Develop positive mindset","Improve personal presence","Master social etiquette","Handle pressure gracefully","Build authentic relationships","Develop leadership qualities","Create personal brand"]',
  '[{"title":"Self-Discovery","duration":"2 weeks","topics":["Personality assessment","Strengths identification","Values and beliefs","Personal vision"],"outcomes":"Understand your personality type and unique strengths"},{"title":"Confidence Building","duration":"3 weeks","topics":["Overcoming fear","Positive affirmation","Body language","Voice modulation","Assertiveness"],"outcomes":"Project confidence in any situation"},{"title":"Social & Professional Presence","duration":"2 weeks","topics":["First impressions","Networking skills","Social etiquette","Professional grooming"],"outcomes":"Make lasting positive impressions"},{"title":"Personal Branding","duration":"2 weeks","topics":["Defining your brand","Online presence","Communication style","Leadership presence"],"outcomes":"Develop a consistent personal brand"}]',
  '["Personality assessment","Personal coaching","Confidence exercises","Video feedback","Social skills practice","Professional grooming tips","Ongoing support","Certificate"]',
  '["Confidence","Positive Mindset","Professional Presence","Social Etiquette","Personal Branding","Assertiveness","Leadership","Self-awareness"]',
  'Personality development enhances overall employability and career growth prospects.',
  'Self-assessments, presentation tasks, role-play evaluations, final personality showcase'
),
(
  'Public Speaking',
  'public-speaking',
  (select id from training_categories where slug = 'communication-skills'),
  'FiGlobe',
  'Overcome stage fear and become a confident, engaging public speaker.',
  'Public speaking is a critical skill for professional success. This program helps participants overcome stage fear, structure compelling presentations, and deliver with confidence. Through practice, feedback, and proven techniques, anyone can become an effective public speaker.',
  '1 Month', 'Online', 'Beginner', 'New', false, false, true, 'published', 10, false,
  'Anyone who wants to overcome stage fear and become a confident speaker.',
  '["Overcome stage fear","Structure presentations","Engage audiences","Use voice effectively","Handle Q&A confidently","Use visual aids","Tell compelling stories","Speak with authenticity"]',
  '[{"title":"Overcoming Stage Fear","duration":"1 week","topics":["Understanding fear","Breathing techniques","Positive visualization","Starting small"],"outcomes":"Manage stage fear effectively"},{"title":"Speech Structure","duration":"1 week","topics":["Opening techniques","Main body structure","Powerful conclusions","Storytelling"],"outcomes":"Structure compelling speeches and presentations"},{"title":"Delivery Skills","duration":"1 week","topics":["Voice modulation","Body language","Eye contact","Audience engagement"],"outcomes":"Deliver with confidence and impact"},{"title":"Practice & Feedback","duration":"1 week","topics":["Practice presentations","Peer feedback","Expert evaluation","Improvement plan"],"outcomes":"Deliver polished presentations"}]',
  '["Expert speaking coaches","Safe practice environment","Video feedback","Peer support","Real presentation opportunities","Personal coaching","Certificate","Stage practice"]',
  '["Public Speaking","Stage Confidence","Storytelling","Voice Modulation","Presentation Structure","Audience Engagement","Authentic Expression","Persuasion"]',
  'Strong public speaking skills enhance interview performance and career growth.',
  'Multiple practice presentations, final speech delivery, peer and expert evaluations'
),
(
  'Leadership Skills',
  'leadership-skills',
  (select id from training_categories where slug = 'leadership-training'),
  'FiGlobe',
  'Develop authentic leadership skills to inspire teams and drive results.',
  'Leadership is not about titles but about influence and impact. This program develops authentic leadership skills including vision-setting, team motivation, decision-making, and effective delegation. Through case studies, simulations, and real-world projects, participants learn to lead with confidence.',
  '2 Months', 'Hybrid', 'Intermediate', 'Best Seller', true, false, true, 'published', 11, true,
  'Aspiring leaders, team leads, and professionals looking to enhance their leadership capabilities.',
  '["Develop leadership vision","Motivate and inspire teams","Make effective decisions","Delegate and empower","Resolve conflicts","Drive change","Build high-performance teams","Communicate vision"]',
  '[{"title":"Leadership Fundamentals","duration":"2 weeks","topics":["Leadership styles","Self-assessment","Vision setting","Values-based leadership"],"outcomes":"Define your leadership philosophy"},{"title":"Team Leadership","duration":"3 weeks","topics":["Team dynamics","Motivation techniques","Delegation","Feedback and coaching"],"outcomes":"Lead teams effectively"},{"title":"Strategic Leadership","duration":"2 weeks","topics":["Decision making","Change management","Conflict resolution","Innovation"],"outcomes":"Navigate complex leadership challenges"}]',
  '["Experienced leaders as mentors","Real case studies","Leadership simulations","360-degree feedback","Peer learning network","Executive coaching","Certificate","Alumni network"]',
  '["Leadership","Strategic Thinking","Team Motivation","Decision Making","Change Management","Conflict Resolution","Delegation","Coaching"]',
  'Leadership skills are highly valued by employers and accelerate career progression.',
  'Leadership simulation exercises, team project, 360-degree feedback assessment'
),
(
  'Teamwork & Collaboration',
  'teamwork-collaboration',
  (select id from training_categories where slug = 'professional-development'),
  'FiUsers',
  'Master the art of collaboration to achieve exceptional results through teamwork.',
  'In today interconnected workplace, the ability to collaborate effectively is essential. This program develops teamwork skills including role clarity, communication, conflict resolution, and collective problem-solving. Through team-based activities and projects, participants experience the power of effective collaboration.',
  '1 Month', 'Hybrid', 'Beginner', '', false, false, false, 'published', 12, false,
  'Students and professionals who want to improve their teamwork and collaboration abilities.',
  '["Understand team dynamics","Communicate effectively","Resolve team conflicts","Collaborate on projects","Build team trust","Leverage diverse strengths","Give and receive feedback","Achieve team goals"]',
  '[{"title":"Team Dynamics","duration":"1 week","topics":["Team roles","Stages of team development","Communication patterns","Trust building"],"outcomes":"Understand team dynamics and your role"},{"title":"Collaborative Skills","duration":"2 weeks","topics":["Effective communication","Active listening","Constructive feedback","Conflict resolution"],"outcomes":"Collaborate effectively in teams"},{"title":"Team Projects","duration":"1 week","topics":["Project planning","Role assignment","Execution","Review and reflection"],"outcomes":"Successfully complete team projects"}]',
  '["Team activities","Collaborative projects","Peer learning","Expert facilitation","Conflict resolution training","Feedback sessions","Certificate","Team-building exercises"]',
  '["Collaboration","Team Communication","Conflict Resolution","Trust Building","Role Clarity","Collective Problem Solving","Feedback","Accountability"]',
  'Employers highly value teamwork skills. Our training enhances your collaborative abilities.',
  'Team project evaluation, peer assessments, facilitator feedback'
),
(
  'Time Management',
  'time-management',
  (select id from training_categories where slug = 'professional-development'),
  'FiClock',
  'Master time management techniques to boost productivity and reduce stress.',
  'Effective time management is the key to productivity and work-life balance. This program teaches proven techniques including prioritization, planning, delegation, and focus management. Participants learn to take control of their time and accomplish more with less stress.',
  '2 Weeks', 'Online', 'Beginner', '', false, false, false, 'published', 13, false,
  'Anyone struggling with time management or looking to boost productivity.',
  '["Prioritize tasks effectively","Plan daily/weekly schedules","Overcome procrastination","Manage distractions","Set SMART goals","Use productivity tools","Delegate effectively","Maintain work-life balance"]',
  '[{"title":"Time Management Fundamentals","duration":"3 days","topics":["Time audit","Priority matrices","Goal setting","Planning systems"]},{"title":"Productivity Techniques","duration":"4 days","topics":["Pomodoro technique","Deep work","Task batching","Eliminating distractions"]},{"title":"Tools & Systems","duration":"3 days","topics":["Digital tools","Calendar management","Delegation","Review and adjust"]}]',
  '["Practical techniques","Productivity tools","Personal coaching","Action plan","Progress tracking","Accountability partner","Certificate","Lifetime access"]',
  '["Time Management","Productivity","Goal Setting","Priority Management","Focus","Planning","Delegation","Work-Life Balance"]',
  'Time management skills are highly valued in professional environments.',
  'Time audit analysis, productivity challenge, final action plan review'
),
(
  'Email & Business Communication',
  'email-business-communication',
  (select id from training_categories where slug = 'corporate-skills'),
  'FiMail',
  'Master professional email writing and business communication for workplace success.',
  'Professional communication, especially email, is a critical workplace skill. This program covers email etiquette, business correspondence, report writing, and professional messaging across various platforms. Participants learn to communicate clearly, professionally, and effectively.',
  '2 Weeks', 'Online', 'Beginner', 'New', false, false, true, 'published', 14, false,
  'Professionals and students who want to improve their business writing skills.',
  '["Write clear professional emails","Master email etiquette","Structure business documents","Communicate across platforms","Handle difficult conversations","Write reports and proposals","Use appropriate tone","Proofread effectively"]',
  '[{"title":"Email Fundamentals","duration":"3 days","topics":["Email structure","Subject lines","Tone and formality","Signature best practices"]},{"title":"Business Writing","duration":"4 days","topics":["Business letters","Report writing","Proposals","Meeting minutes"]},{"title":"Professional Communication","duration":"3 days","topics":["Instant messaging","Video call etiquette","Cross-cultural communication","Difficult conversations"]}]',
  '["Professional writers as trainers","Real-world templates","Personalized feedback","Peer review","Best practice guides","Certificate","Lifetime access to templates","Ongoing support"]',
  '["Email Writing","Business Correspondence","Professional Tone","Report Writing","Cross-cultural Communication","Proofreading","Documentation","Platform Etiquette"]',
  'Strong business communication skills significantly improve professional image and career prospects.',
  'Writing assignments, email drafting exercises, final business document submission'
),
(
  'Corporate Etiquette',
  'corporate-etiquette',
  (select id from training_categories where slug = 'corporate-skills'),
  'FiBriefcase',
  'Learn the unwritten rules of corporate behavior and professional conduct.',
  'Corporate etiquette is essential for building professional relationships and advancing your career. This program covers everything from meeting etiquette and dining etiquette to dress code and cross-cultural professional behavior. Participants gain the confidence to navigate any corporate situation.',
  '2 Weeks', 'Online', 'Beginner', '', false, false, false, 'published', 15, false,
  'Fresh graduates, new employees, and anyone entering the corporate world.',
  '["Demonstrate professional etiquette","Navigate corporate culture","Handle meetings professionally","Practice proper dining etiquette","Dress appropriately","Interact with senior professionals","Understand corporate hierarchy","Build professional relationships"]',
  '[{"title":"Corporate Culture","duration":"3 days","topics":["Understanding corporate culture","Organizational hierarchy","Professional relationships","First day tips"]},{"title":"Meeting & Event Etiquette","duration":"4 days","topics":["Meeting protocols","Virtual meeting etiquette","Business meals","Networking events"]},{"title":"Professional Presence","duration":"3 days","topics":["Dress code","Communication style","Office etiquette","Cross-cultural awareness"]}]',
  '["Corporate professionals as trainers","Real scenarios","Role-playing","Etiquette guides","Video demonstrations","Personal coaching","Certificate","Reference materials"]',
  '["Corporate Etiquette","Professional Conduct","Meeting Protocols","Dining Etiquette","Dress Code","Cross-cultural Awareness","Professional Presence","Networking"]',
  'Corporate etiquette expertise enhances professional credibility and career advancement.',
  'Etiquette demonstrations, role-play evaluations, final professional conduct assessment'
),
(
  'Presentation Skills',
  'presentation-skills',
  (select id from training_categories where slug = 'communication-skills'),
  'FiMonitor',
  'Create and deliver powerful presentations that captivate and persuade audiences.',
  'Whether presenting to a small team or a large audience, the ability to communicate ideas effectively is crucial. This program covers presentation design, storytelling, visual aids, and delivery techniques. Participants create and deliver multiple presentations with expert feedback.',
  '3 Weeks', 'Hybrid', 'Intermediate', '', false, false, false, 'published', 16, true,
  'Professionals and students who need to create and deliver effective presentations.',
  '["Design compelling presentations","Tell stories effectively","Use visual aids strategically","Engage audiences","Handle Q&A confidently","Present data clearly","Adapt to any audience","Deliver with impact"]',
  '[{"title":"Presentation Design","duration":"1 week","topics":["Structure and flow","Storytelling techniques","Visual design principles","Slide creation"]},{"title":"Delivery Skills","duration":"1 week","topics":["Voice and body language","Audience engagement","Handling nerves","Q&A management"]},{"title":"Practice & Polish","duration":"1 week","topics":["Practice presentations","Video review","Peer feedback","Final presentation"]}]',
  '["Expert presentation coaches","Design tools training","Video feedback","Peer presentations","Real audience practice","Personal coaching","Certificate","Template library"]',
  '["Presentation Design","Storytelling","Data Visualization","Audience Engagement","Confident Delivery","Slide Crafting","Impromptu Speaking","Persuasion"]',
  'Strong presentation skills give you a competitive edge in interviews and career growth.',
  'Multiple presentation rounds with expert evaluation and feedback'
),
(
  'Critical Thinking',
  'critical-thinking',
  (select id from training_categories where slug = 'professional-development'),
  'FiLayers',
  'Develop critical thinking skills to analyze problems and make better decisions.',
  'Critical thinking is one of the most sought-after skills in the modern workplace. This program develops analytical thinking, logical reasoning, and decision-making abilities. Through case studies, puzzles, and real-world scenarios, participants learn to think more clearly and make better decisions.',
  '1 Month', 'Online', 'Intermediate', '', false, false, false, 'published', 17, false,
  'Professionals and students looking to improve their analytical and critical thinking abilities.',
  '["Analyze problems systematically","Evaluate arguments logically","Identify biases","Make data-driven decisions","Think creatively","Question assumptions","Draw valid conclusions","Communicate reasoning clearly"]',
  '[{"title":"Critical Thinking Fundamentals","duration":"1 week","topics":["What is critical thinking","Logical fallacies","Argument analysis","Evidence evaluation"]},{"title":"Analytical Techniques","duration":"2 weeks","topics":["Root cause analysis","Data interpretation","Decision frameworks","Systems thinking"]},{"title":"Applied Thinking","duration":"1 week","topics":["Case studies","Real-world problems","Creative solutions","Presentation of analysis"]}]',
  '["Expert facilitators","Case study method","Interactive exercises","Real-world problems","Peer discussion","Personal coaching","Certificate","Resource library"]',
  '["Critical Thinking","Analytical Reasoning","Problem Analysis","Decision Making","Logical Reasoning","Creative Problem Solving","Bias Awareness","Evidence Evaluation"]',
  'Critical thinking is among the top skills employers seek. Master it for career success.',
  'Case study analysis, problem-solving exercises, final analytical project'
),
(
  'Problem Solving',
  'problem-solving',
  (select id from training_categories where slug = 'professional-development'),
  'FiCode',
  'Master structured problem-solving techniques to tackle any challenge effectively.',
  'Problem-solving is an essential skill in every profession. This program teaches structured approaches including design thinking, root cause analysis, and creative problem-solving. Through hands-on exercises and real-world scenarios, participants develop the confidence to solve complex problems.',
  '1 Month', 'Hybrid', 'Intermediate', '', false, false, false, 'published', 18, true,
  'Anyone who wants to improve their problem-solving and analytical thinking skills.',
  '["Apply structured problem-solving","Use design thinking","Conduct root cause analysis","Generate creative solutions","Evaluate options effectively","Implement solutions","Learn from failures","Collaborate on solutions"]',
  '[{"title":"Problem-Solving Frameworks","duration":"1 week","topics":["Problem definition","Root cause analysis","Design thinking","Six thinking hats"]},{"title":"Creative Techniques","duration":"1 week","topics":["Brainstorming","Mind mapping","Reverse thinking","Lateral thinking"]},{"title":"Implementation & Review","duration":"2 weeks","topics":["Solution evaluation","Action planning","Implementation","Review and iteration"]}]',
  '["Structured methodology","Hands-on practice","Real case studies","Creative techniques","Peer collaboration","Expert guidance","Certificate","Toolkit"]',
  '["Problem Solving","Design Thinking","Root Cause Analysis","Creative Thinking","Solution Design","Decision Making","Iterative Learning","Analytical Skills"]',
  'Strong problem-solving skills make you invaluable to any organization.',
  'Problem-solving exercises, case study analysis, final project presentation'
),
(
  'Workplace Readiness',
  'workplace-readiness',
  (select id from training_categories where slug = 'student-development'),
  'FiBriefcase',
  'Be fully prepared for your first job with essential workplace skills and knowledge.',
  'Transitioning from college to corporate can be challenging. This comprehensive program prepares students for the workplace by covering professional expectations, workplace culture, communication norms, and career management. Participants gain the confidence to start their professional journey successfully.',
  '2 Months', 'Hybrid', 'Beginner', 'Popular', true, true, false, 'published', 19, true,
  'College students in their final year or recent graduates preparing to enter the workforce.',
  '["Understand workplace culture","Communicate professionally","Manage workplace relationships","Handle responsibilities","Navigate office politics","Build professional network","Manage career growth","Maintain work-life balance"]',
  '[{"title":"Workplace Fundamentals","duration":"2 weeks","topics":["Corporate culture","Professional expectations","Workplace communication","Hierarchy and reporting"]},{"title":"Professional Skills","duration":"3 weeks","topics":["Time management","Email etiquette","Meeting participation","Project coordination"]},{"title":"Career Management","duration":"2 weeks","topics":["Performance reviews","Professional development","Networking","Career planning"]}]',
  '["Industry professionals","Real workplace scenarios","Mock office environment","Career counseling","Professional network","Certificate","Placement support","Alumni access"]',
  '["Workplace Readiness","Professional Communication","Corporate Culture","Career Management","Professional Networking","Office Etiquette","Performance Management","Work-Life Balance"]',
  'Direct placement support with our partner companies. Workplace-ready candidates preferred.',
  'Workplace simulation exercises, professional conduct assessment, final career readiness evaluation'
),
(
  'Career Guidance',
  'career-guidance',
  (select id from training_categories where slug = 'career-development'),
  'FiStar',
  'Get personalized career guidance to make informed decisions about your professional future.',
  'Choosing the right career path is one of the most important decisions you will make. Our career guidance program provides personalized counseling, psychometric assessments, and industry insights to help you discover your strengths and chart the best career path forward.',
  'Customizable', 'Online', 'All Levels', 'Popular', false, true, false, 'published', 20, false,
  'Students, graduates, and professionals at any career stage seeking guidance.',
  '["Identify career strengths","Explore career options","Create career roadmap","Build professional network","Develop job search strategy","Make informed decisions","Gain industry insights","Achieve career goals"]',
  '[{"title":"Self Discovery","duration":"1 week","topics":["Psychometric assessment","Strengths identification","Interest mapping","Personality profiling"]},{"title":"Career Exploration","duration":"1 week","topics":["Industry research","Role exploration","Growth trajectories","Salary insights"]},{"title":"Action Planning","duration":"1 week","topics":["Skill development plan","Education roadmap","Networking strategy","Timeline creation"]}]',
  '["Experienced career counselors","Psychometric assessments","Industry insights","Personalized roadmap","1-on-1 counseling","Network building","Ongoing support","Alumni network"]',
  '["Career Planning","Self Awareness","Industry Knowledge","Goal Setting","Decision Making","Professional Networking","Personal Branding","Strategic Planning"]',
  'Career guidance significantly improves job search effectiveness and career satisfaction.',
  'Career assessment analysis, personalized roadmap creation, follow-up sessions'
)
on conflict (slug) do nothing;

-- TRAINING MODULES (detailed modules for key programs)
insert into training_modules (training_id, title, duration, topics, outcomes, sort_order)
select id, 'Foundation Skills', '2 weeks', '["Self-assessment","Goal setting","Learning styles","Time management basics"]'::jsonb, 'Build a strong foundation for professional growth', 1 from training_programs where slug = 'student-skill-development'
union all select id, 'Communication Basics', '3 weeks', '["Verbal communication","Active listening","Non-verbal cues","Presentation basics"]'::jsonb, 'Communicate with clarity and confidence', 2 from training_programs where slug = 'student-skill-development'
union all select id, 'Professional Skills', '2 weeks', '["Professional etiquette","Workplace readiness","Team dynamics","Personal branding"]'::jsonb, 'Demonstrate professional behavior', 3 from training_programs where slug = 'student-skill-development';

-- TESTIMONIALS
insert into training_testimonials (training_id, student_name, photo, college, company, rating, review, sort_order)
select id, 'Priya Sharma', '', 'Delhi University', 'TCS', 5, 'The placement preparation program was incredible. The mock interviews and aptitude training helped me crack TCS with ease. Highly recommend to all job seekers!', 1 from training_programs where slug = 'placement-preparation'
union all select id, 'Rahul Verma', '', 'Mumbai University', 'Infosys', 4, 'The communication skills program transformed my confidence. I can now present ideas clearly and handle interviews with ease.', 1 from training_programs where slug = 'communication-skills'
union all select id, 'Ananya Gupta', '', 'Pune University', 'Amazon', 5, 'Soft skills development at Marvel Slice was a game-changer. The trainers are experts and the curriculum is very practical.', 1 from training_programs where slug = 'soft-skills-development'
union all select id, 'Vikram Singh', '', 'BITS Pilani', 'Microsoft', 5, 'The leadership skills program helped me become a better team lead. I still use the frameworks I learned here.', 1 from training_programs where slug = 'leadership-skills';

-- STATISTICS
insert into training_statistics (training_id, title, value, icon, sort_order)
select id, 'Students Trained', '8,000+', 'FiUsers', 1 from training_programs where slug = 'student-skill-development'
union all select id, 'Placement Success', '92%', 'FiTrendingUp', 2 from training_programs where slug = 'student-skill-development'
union all select id, 'Mock Interviews', '3,500+', 'FiMessageCircle', 3 from training_programs where slug = 'student-skill-development'
union all select id, 'Hiring Partners', '500+', 'FiGlobe', 4 from training_programs where slug = 'student-skill-development'
union all select id, 'Certificates', '6,000+', 'FiAward', 5 from training_programs where slug = 'student-skill-development'
union all select id, 'Expert Trainers', '50+', 'FiStar', 6 from training_programs where slug = 'student-skill-development';

-- FAQs
insert into training_faqs (training_id, question, answer, sort_order, is_active, category)
select id, 'What is the duration of the training program?', 'Program durations vary from 2 weeks to 3 months depending on the specific program. Detailed schedules are provided at enrollment.', 1, true, 'Program Details' from training_programs where slug = 'student-skill-development'
union all select id, 'Is this program online or offline?', 'We offer both modes. Most programs are hybrid, allowing you to attend in-person or online based on your preference.', 2, true, 'Mode' from training_programs where slug = 'student-skill-development'
union all select id, 'Will I get a certificate?', 'Yes, successful completion of the program earns you a certificate recognized by our industry partners.', 3, true, 'Certification' from training_programs where slug = 'student-skill-development'
union all select id, 'Is there placement support?', 'Yes, our top performers get placement assistance and referrals to our 500+ partner companies.', 4, true, 'Placement' from training_programs where slug = 'placement-preparation'
union all select id, 'What if I miss a session?', 'All sessions are recorded and made available in your learning portal. You can access them anytime.', 1, true, 'Support' from training_programs where slug = 'communication-skills';
