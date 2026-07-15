import type { Translations } from './types';

/**
 * Arabic translation — Skilluv Phase 4.13.
 *
 * RTL direction is applied at the layout root via `dir="rtl"` when locale is 'ar'.
 * A few enterprise/admin strings stay in English as placeholder — a professional
 * translator will iterate. The core user journeys (auth, challenges, forum,
 * guilds, community, settings, errors) are translated.
 */
export const ar: Translations = {
	common: {
		actions: {
			save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل',
			search: 'بحث', retry: 'إعادة المحاولة', back: 'رجوع', next: 'التالي',
			previous: 'السابق', submit: 'إرسال', confirm: 'تأكيد', close: 'إغلاق',
			create: 'إنشاء', loading: 'جاري التحميل...', sending: 'جاري الإرسال...'
		},
		nav: {
			home: 'الرئيسية', challenges: 'التحديات', leaderboards: 'التصنيفات',
			profile: 'الملف الشخصي', settings: 'الإعدادات', notifications: 'الإشعارات',
			login: 'تسجيل الدخول', register: 'ابدأ', logout: 'تسجيل الخروج', community: 'المجتمع'
		},
		domains: { code: 'برمجة', design: 'تصميم', game: 'ألعاب', security: 'أمن سيبراني' },
		titles: { apprenti: 'متدرب', ranger: 'كشّاف', artisan: 'حرفي', maitre: 'معلم', doyen: 'شيخ', legende: 'أسطورة' },
		difficulty: { 1: 'مبتدئ', 2: 'سهل', 3: 'متوسط', 4: 'متقدم', 5: 'خبير' },
		tone: { serious: 'جاد', fun: 'ممتع', educational: 'تعليمي' },
		time: { minutes: '{n} د', hours: '{n}س', noLimit: 'بدون حد', ago: 'منذ' },
		fragments: 'شظايا', streak: 'سلسلة', team: 'فريق', votes: 'أصوات', page: 'صفحة'
	},
	landing: {
		title: 'أثبت ما يمكنك فعله.',
		titleAccent: 'حقاً.',
		subtitle: 'سكيلوف هي المنصة التي يثبت فيها المواهب التقنية مهاراتهم من خلال تحديات ملموسة. لا سيرة ذاتية. لا ادعاءات. الدليل فقط.',
		cta: 'ابدأ مجاناً',
		ctaSecondary: 'استعرض التحديات',
		statDomains: 'مجالات',
		statLanguages: 'لغات',
		statFree: 'مجاني'
	},
	dashboard: {
		greeting: 'مرحباً، {name}',
		cardChallenges: 'التحديات',
		cardChallengesDesc: 'استكشف التحديات وأكملها لكسب الشظايا.',
		cardProfile: 'ملفي',
		cardProfileDesc: 'ملفك الحي، مبني على أدلتك.',
		cardLeaderboards: 'التصنيفات',
		cardLeaderboardsDesc: 'أفضل 100 مباشرة حسب المجال والبلد.'
	},
	auth: {
		register: {
			pickDomain: 'ما الذي يشغفك؟',
			pickDomainSub: 'اختر مجالك الرئيسي. يمكنك استكشاف الآخرين لاحقاً.',
			codeDesc: 'تطوير ويب، جوال، خلفي، خوارزميات...',
			designDesc: 'واجهات، جرافيك، رسم توضيحي، حركة...',
			gameDesc: 'تصميم ألعاب، تطوير، ثلاثي الأبعاد، سرد...',
			securityDesc: 'اختبار اختراق، CTF، تحقيق جنائي، تشفير...',
			changeDomain: '← تغيير المجال',
			createAccount: 'أنشئ حسابك',
			domain: 'المجال',
			username: 'اسم المستخدم',
			email: 'البريد الإلكتروني',
			firstName: 'الاسم الأول',
			lastName: 'اسم العائلة',
			password: 'كلمة المرور',
			passwordHint: '8 أحرف على الأقل',
			creating: 'جاري الإنشاء...',
			createBtn: 'أنشئ حسابي',
			hasAccount: 'لديك حساب بالفعل؟',
			loginLink: 'تسجيل الدخول'
		},
		login: {
			title: 'مرحباً بعودتك',
			subtitle: 'سجل الدخول لمتابعة رحلتك.',
			identifier: 'البريد الإلكتروني أو اسم المستخدم',
			password: 'كلمة المرور',
			forgotPassword: 'نسيت كلمة المرور؟',
			totpLabel: 'رمز TOTP (Google Authenticator)',
			email2faMessage: 'تم إرسال رمز إلى بريدك الإلكتروني.',
			email2faLabel: 'رمز التحقق',
			loggingIn: 'جاري تسجيل الدخول...',
			loginBtn: 'تسجيل الدخول',
			noAccount: 'ليس لديك حساب بعد؟',
			registerLink: 'إنشاء حساب'
		},
		forgot: {
			title: 'نسيت كلمة المرور',
			subtitle: 'أدخل بريدك الإلكتروني وسنرسل رابط إعادة تعيين.',
			sendLink: 'إرسال الرابط',
			sending: 'جاري الإرسال...',
			sentTitle: 'تم إرسال البريد',
			sentMessage: 'إذا كان الحساب موجوداً، ستتلقى رابط إعادة تعيين.',
			backToLogin: 'رجوع لتسجيل الدخول'
		},
		reset: {
			title: 'كلمة مرور جديدة',
			subtitle: 'اختر كلمة مرور آمنة جديدة.',
			newPassword: 'كلمة المرور الجديدة',
			confirmPassword: 'تأكيد كلمة المرور',
			changing: 'جاري التغيير...',
			changeBtn: 'تغيير كلمة المرور',
			successTitle: 'تم تغيير كلمة المرور',
			successMessage: 'جاري إعادة التوجيه...',
			passwordMismatch: 'كلمات المرور غير متطابقة.',
			invalidLink: 'رابط غير صالح. اطلب رابطاً جديداً.'
		},
		verify: {
			verifying: 'جاري التحقق...',
			successTitle: 'تم التحقق من البريد',
			errorTitle: 'خطأ',
			invalidLink: 'رابط التحقق غير صالح.',
			loginBtn: 'تسجيل الدخول'
		},
		footer: 'سكيلوف © {year} — أثبت ما يمكنك فعله.'
	},
	challenges: {
		title: 'التحديات',
		subtitle: 'استكشف، برمج، اكسب شظايا.',
		allDomains: 'الكل',
		allDifficulties: 'الكل',
		noneFound: 'لا توجد تحديات بهذه المعايير.',
		locked: 'الشروط غير مستوفاة',
		onboarding: {
			title: 'التحدي الأول',
			onboardingLabel: 'تحدي التعريف',
			startBtn: 'ابدأ التحدي',
			starting: 'جاري البدء...',
			hint: '~10 دقائق · سيتم إنشاء ملفك في النهاية',
			minutesLabel: '{n} دقيقة',
			fragmentsToEarn: 'شظية للكسب'
		},
		detail: {
			backToCatalogue: '← رجوع للقائمة',
			instructions: 'التعليمات',
			expectedOutput: 'الناتج المتوقع',
			prerequisite: 'الشرط: {n} ◆ شظية على الأقل',
			reward: 'المكافأة',
			duration: 'المدة',
			difficulty: 'الصعوبة',
			mode: 'الوضع',
			startBtn: 'ابدأ',
			starting: 'جاري البدء...',
			noAi: 'غير مسموح باستخدام الذكاء الاصطناعي'
		},
		sandbox: {
			instructions: 'التعليمات',
			output: 'الناتج',
			testBtn: 'اختبار',
			submitBtn: 'إرسال',
			executing: 'جاري التنفيذ...',
			testHint: 'انقر "اختبار" لتشغيل الشيفرة.',
			saved: 'محفوظ {time}',
			back: '← رجوع',
			resultSuccess: 'تم إكمال التحدي!',
			resultWelcome: 'مرحباً، متدرب ☆',
			resultNotYet: 'ليس بعد.',
			resultFragments: '+{n} شظية',
			resultPerseverance: '+{n} مثابرة',
			retryBtn: 'إعادة المحاولة',
			viewChallenges: 'رؤية التحديات',
			myProfile: 'ملفي',
			loadingSandbox: 'جاري تحميل البيئة...'
		}
	},
	profile: {
		title: 'الملف الشخصي',
		notFound: 'الملف غير موجود.',
		stats: { fragments: 'شظايا', challenges: 'تحديات', streak: 'سلسلة', trust: 'ثقة' },
		sections: { activity: 'النشاط', skills: 'المهارات', badges: 'الشارات' },
		noSkills: 'لا توجد مهارات بعد. أكمل تحديك الأول!',
		links: { github: 'GitHub', linkedin: 'LinkedIn', twitter: 'X/Twitter', website: 'الموقع' }
	},
	leaderboard: {
		title: 'التصنيفات',
		subtitle: 'أفضل 100 مباشرة.',
		global: 'عام',
		alltime: 'كل الأوقات',
		monthly: 'هذا الشهر',
		weekly: 'هذا الأسبوع',
		yourRank: 'ترتيبك',
		score: 'النتيجة',
		participants: 'المشاركون',
		noParticipants: 'لا يوجد مشاركون في هذا التصنيف.'
	},
	enterprise: {
		register: {
			title: 'فضاء الشركات',
			subtitle: 'وظف بناءً على الأدلة، لا السير الذاتية.',
			companyName: 'اسم الشركة',
			companySize: 'حجم الشركة',
			website: 'الموقع',
			industry: 'الصناعة',
			country: 'البلد',
			createBtn: 'أنشئ فضاء الشركة',
			creating: 'جاري الإنشاء...',
			talentLink: 'هل أنت موهبة؟'
		},
		nav: { dashboard: 'لوحة التحكم', talents: 'المواهب', bookmarks: 'المفضلة', lists: 'القوائم', messages: 'الرسائل' },
		dashboard: {
			title: 'لوحة التحكم', subtitle: 'نظرة عامة على نشاط التوظيف.',
			myActivity: 'نشاطي', platform: 'منصة سكيلوف',
			bookmarks: 'المفضلة', lists: 'القوائم', interests: 'طلبات الاهتمام',
			conversations: 'المحادثات', pending: 'قيد الانتظار', accepted: 'مقبولة',
			totalTalents: 'المواهب المسجلة', active30d: 'نشطة (30 يوم)',
			avgFragments: 'متوسط الشظايا', byDomain: 'حسب المجال',
			searchTalents: 'ابحث عن مواهب', viewBookmarks: 'رؤية المفضلة'
		},
		talents: {
			title: 'ابحث عن مواهب', subtitle: 'اعثر على مهارات موثقة، لا سير ذاتية.',
			searchPlaceholder: 'ابحث بالاسم، المهارة...', searchBtn: 'بحث',
			allLevels: 'كل المستويات', byFragments: 'حسب الشظايا', byRecent: 'حسب الأحدث', byRelevance: 'الصلة',
			noResults: 'لم يتم العثور على مواهب بهذه المعايير.',
			addBookmark: 'أضف للمفضلة', removeBookmark: 'أزل من المفضلة'
		},
		bookmarks: {
			title: 'المفضلة', subtitle: 'المواهب التي حفظتها.',
			empty: 'لا توجد مفضلة. ابحث عن مواهب لإضافتها.',
			emptyAction: 'بحث', remove: 'إزالة'
		},
		lists: {
			title: 'قوائم المواهب', subtitle: 'نظم المرشحين حسب القوائم.',
			newList: '+ قائمة جديدة', cancelBtn: 'إلغاء',
			listName: 'اسم القائمة', description: 'الوصف', createBtn: 'إنشاء',
			empty: 'لا توجد قوائم.', talents: '{n} موهبة',
			emptyList: 'هذه القائمة فارغة. أضف مواهب من البحث.',
			emptyListAction: 'بحث', backToLists: '← رجوع للقوائم'
		},
		messages: {
			title: 'الرسائل', subtitle: 'محادثاتك مع المواهب.',
			empty: 'لا توجد محادثات. تواصل مع موهبة للبدء.',
			emptyAction: 'بحث',
			closed: 'المحادثة مغلقة', inputPlaceholder: 'اكتب رسالة...', sendBtn: 'إرسال'
		},
		types: {
			legend: 'اختر نوع المؤسسة',
			stepTitle: 'ما نوع مؤسستك؟',
			stepSubtitle: 'يخصص Skilluv مساحتك وقناتك وخيارات الدفع حسب نوعك. يمكن تعديله لاحقاً.',
			stepSubmit: 'حفظ النوع',
			stepSkip: 'تخطي الآن',
			direct_hire: {
				label: 'توظيف مباشر',
				description: 'أنت توظف لفرقك الخاصة.',
				benefit1: 'قناة مرشحين بسيطة',
				benefit2: 'إشارات مرجعية وقوائم ومحادثات مباشرة',
				benefit3: 'بدون عمولات وسيطة'
			},
			staffing_agency: {
				label: 'وكالة توظيف',
				description: 'أنت تُلحق مواهب بعملائك.',
				benefit1: 'إدارة عملاء متعددين',
				benefit2: 'إسناد الموهبة إلى العميل',
				benefit3: 'علامة تجارية بيضاء اختيارية'
			},
			remote_international: {
				label: 'عمل عن بُعد دولي',
				description: 'أنت توظف عن بُعد عبر EOR (Deel, Remote, Oyster).',
				benefit1: 'تكوين EOR مدمج',
				benefit2: 'عملات متعددة + منطقة زمنية',
				benefit3: 'اقتطاعات ضريبية حسب الدولة'
			}
		},
		agencyClients: {
			title: 'عملائي',
			subtitle: 'أدر قائمة عملائك لإسناد المواهب في القناة.',
			addBtn: 'إضافة عميل',
			edit: 'تعديل',
			empty: 'لا عملاء بعد.',
			emptyAction: 'أنشئ عميلي الأول',
			nameLabel: 'اسم العميل',
			nameError: 'اسم العميل مطلوب',
			emailLabel: 'بريد التواصل',
			notesLabel: 'ملاحظات داخلية',
			activeLabel: 'عميل نشط',
			saveBtn: 'حفظ',
			cancelBtn: 'إلغاء',
			deleteBtn: 'أرشفة',
			deleteConfirm: 'أرشفة هذا العميل؟ تبقى الإسنادات التاريخية مرئية.',
			restoreBtn: 'استعادة',
			archivedBadge: 'مؤرشف',
			createdOn: 'أُنشئ في {date}',
			ownerOnly: 'مخصص لحسابات الوكالات (staffing_agency).'
		},
		eor: {
			title: 'تكوين EOR',
			subtitle: 'صاحب العمل المسجل — يحدد المزود الذي يدير العقد والرواتب والاقتطاعات الضريبية.',
			providerLabel: 'مزود EOR',
			currencyLabel: 'عملة الدفع',
			timezoneLabel: 'المنطقة الزمنية المطلوبة',
			timezoneHint: 'صيغة IANA (مثل Africa/Porto-Novo, Europe/Paris).',
			taxCountryLabel: 'دولة الاقتطاع الضريبي',
			saveBtn: 'حفظ التكوين'
		},
		dashboardCards: {
			agencyClients: 'عملاء الوكالة',
			agencyClientsDesc: 'أدر محفظة عملائك والإسنادات.',
			eorConfig: 'تكوين EOR',
			eorConfigDesc: 'المزود، العملة، المنطقة الزمنية، الاقتطاع الضريبي.',
			manageType: 'تعديل نوع المؤسسة'
		}
	},
	notifications: {
		title: 'الإشعارات', markAllRead: 'وضع علامة كمقروء', unread: 'غير مقروء', all: 'الكل',
		empty: 'لا توجد إشعارات.',
		types: {
			interest_request_received: 'طلب اهتمام مستلم',
			interest_accepted: 'تم قبول الطلب',
			interest_declined: 'تم رفض الطلب',
			new_message: 'رسالة جديدة',
			challenge_approved: 'تحدي معتمد',
			challenge_rejected: 'تحدي مرفوض',
			account_banned: 'الحساب معلق',
			account_unbanned: 'تم استعادة الحساب'
		}
	},
	settings: {
		title: 'الإعدادات',
		theme: {
			title: 'المظهر', forge: 'Forge', forgeDesc: 'مغرة + طين — ورشة الحرفي',
			vesperal: 'Vespéral', vesperalDesc: 'أزرق ليلي + برتقالي جمر — ليلة الفانوس',
			arena: 'Arena', arenaDesc: 'أحمر شعاري + ذهبي — بطولة قروسطية',
			scriptorium: 'Scriptorium', scriptoriumDesc: 'رقّ + حبر — الناسخ الراهب',
			sakura: 'Sakura', sakuraDesc: 'خوخي + زهر الكرز — موسم الكرز'
		},
		language: { title: 'اللغة', fr: 'Français', en: 'English' },
		profileSection: {
			title: 'الملف الشخصي', displayName: 'اسم العرض',
			bio: 'نبذة', bioHint: 'وصف قصير مرئي على ملفك'
		},
		password: {
			title: 'كلمة المرور', current: 'كلمة المرور الحالية',
			new: 'كلمة المرور الجديدة', newHint: '8 أحرف على الأقل', changeBtn: 'تغيير كلمة المرور'
		},
		privacy: {
			title: 'الخصوصية', showHeatmap: 'إظهار خريطة النشاط',
			showSkillTree: 'إظهار شجرة المهارات', showBadges: 'إظهار الشارات',
			showStreak: 'إظهار السلسلة', showEmail: 'إظهار البريد',
			allowInterests: 'السماح بطلبات الاهتمام من الشركات'
		},
		security: {
			title: 'الأمان', twoFa: 'المصادقة الثنائية (TOTP)',
			twoFaDesc: 'Google Authenticator / Authy', enabled: 'مفعّلة', disabled: 'معطّلة'
		},
		danger: {
			title: 'منطقة الخطر',
			deleteWarning: 'الحذف نهائي. سيتم مسح كل بياناتك وفقاً للنظام الأوروبي RGPD.',
			deleteBtn: 'احذف حسابي', deleteModalTitle: 'حذف الحساب',
			deleteModalMessage: 'هذا الإجراء نهائي. أدخل كلمة المرور للتأكيد.',
			deleteConfirmBtn: 'حذف نهائي'
		}
	},
	admin: {
		dashboard: {
			title: 'لوحة الإدارة', platform: 'المنصة', moderation: 'الإشراف',
			users: 'المستخدمون', activeUsers: 'نشط (30 يوم)', challenges: 'التحديات', drafts: 'مسودات',
			submissions: 'الإرسالات', today: 'اليوم', wsConnections: 'الاتصالات النشطة',
			pendingReports: 'التقارير المعلقة', bans30d: 'الحظر (30 يوم)',
			actionsToday: 'إجراءات المسؤول (اليوم)', totalReports: 'إجمالي التقارير', resolved: 'محلولة',
			viewReports: 'رؤية التقارير', manageChallenges: 'إدارة التحديات', reviewCommunity: 'مراجعة المجتمع'
		},
		reports: {
			title: 'التقارير', pending: 'معلقة', resolvedLabel: 'محلولة', dismissed: 'مرفوضة', allLabel: 'الكل',
			resolveBtn: 'حل', dismissBtn: 'رفض', reportedBy: 'أبلغ عنه', noReports: 'لا توجد تقارير.'
		},
		users: {
			title: 'المستخدمون', searchPlaceholder: 'بحث...', searchBtn: 'بحث',
			banBtn: 'حظر', unbanBtn: 'إلغاء الحظر', banned: 'محظور', banReason: 'سبب الحظر:'
		},
		challenges: { title: 'التحديات', total: 'إجمالي التحديات', publishBtn: 'نشر', archiveBtn: 'أرشفة' },
		community: {
			title: 'مراجعة المجتمع', subtitle: 'تحديات مقدمة من المجتمع في انتظار المصادقة.',
			approveBtn: 'موافقة', rejectBtn: 'رفض', rejectFeedback: 'ملاحظات للمنشئ:',
			viewInstructions: 'رؤية التعليمات', by: 'من قبل', empty: 'لا توجد تحديات في انتظار المراجعة.'
		},
		audit: {
			title: 'سجل المراجعة', date: 'التاريخ', admin: 'المسؤول', action: 'الإجراء', target: 'الهدف',
			details: 'التفاصيل', empty: 'لا توجد إجراءات مسجلة.'
		}
	},
	community: {
		title: 'تحديات المجتمع', subtitle: 'أنشئت من قبل المجتمع، صوّت عليها المواهب.',
		myChallenges: 'تحدياتي', createBtn: 'إنشاء',
		empty: 'لا توجد تحديات مجتمعية بعد. كن الأول!',
		emptyFirst: 'لم تنشئ تحدياً بعد.',
		create: {
			title: 'أنشئ تحدياً',
			subtitle: 'اقترح تحدياً للمجتمع. سيتم مراجعته من قبل الفريق قبل النشر.',
			challengeTitle: 'العنوان', description: 'الوصف', instructions: 'التعليمات',
			instructionsPlaceholder: 'تعليمات مفصلة للتحدي...',
			domain: 'المجال', difficulty: 'الصعوبة', language: 'اللغة', duration: 'المدة (دقائق)',
			durationPlaceholder: 'بدون حد', expectedOutput: 'الناتج المتوقع',
			expectedOutputPlaceholder: 'اختياري — الناتج الذي يجب أن ينتجه الشيفرة',
			submitForReview: 'أرسل مباشرة للمراجعة',
			submitForReviewHint: 'وإلا سيُحفظ كمسودة',
			submitBtn: 'إرسال للمراجعة', saveDraft: 'حفظ كمسودة',
			creating: 'جاري الإنشاء...', submitted: 'تم إرسال التحدي للمراجعة!', draftSaved: 'تم حفظ المسودة.'
		},
		mine: {
			title: 'تحدياتي', empty: 'لم تنشئ تحدياً بعد.', createFirst: 'أنشئ الأول',
			status: { draft: 'مسودة', review: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض' }
		}
	},
	errors: {
		notFound: 'الصفحة غير موجودة',
		notFoundMessage: 'هذه الصفحة غير موجودة أو تم نقلها.',
		forbidden: 'الوصول ممنوع',
		forbiddenMessage: 'ليس لديك إذن للوصول لهذه الصفحة.',
		genericTitle: 'حدث خطأ',
		genericMessage: 'حدث خطأ غير متوقع.',
		backHome: 'رجوع للرئيسية',
		retryBtn: 'إعادة المحاولة',
		generic: 'حدث خطأ. حاول مرة أخرى.'
	},
	badges: {
		sections: {
			rank: 'الرتبة',
			patches: 'المهارات المُثبَتة',
			medals: 'الميداليات',
			crests: 'شعارات النقابة',
			seal: 'ختم',
			sealsCount: 'ختوم التحديات',
			stampsCount: 'طوابع الأحداث',
			countersLabel: 'الختوم والطوابع'
		},
		rank: {
			achievedOn: 'منذ {date}',
			previous: 'سابقاً {previous}'
		},
		empty: {
			own: 'لا شارات بعد. أنهِ أول تحدٍ لكسب واحدة.',
			public: 'لا يمتلك هذا الشخص أي شارات بعد. ادعُه للمساهمة.'
		}
	},
	orientations: {
		sectionTitle: 'التوجهات المهنية',
		primary: 'رئيسية',
		workingLanguages: 'لغات العمل',
		timezone: 'المنطقة الزمنية',
		selectionOrder: 'الاختيار رقم {n}',
		mode: {
			learning: 'قيد التعلم',
			active: 'نشط'
		},
		empty: {
			own: 'لم يتم اختيار توجه. ستبقى قائمتك عامة حتى تختار واحداً.',
			public: 'لا توجد توجهات مسجلة.'
		},
		selector: {
			title: 'اختر توجهاتك',
			subtitle: 'اختر حتى {max} توجهات. ستتبع قائمتك ومجتمعك اختياراتك.',
			filterLabel: 'تصفية حسب المجال',
			allDomains: 'كل المجالات',
			emptyFilter: 'لا يوجد توجه في هذا المجال. غيّر التصفية.',
			summary: 'اختيارك',
			setPrimary: 'رئيسي',
			remove: 'إزالة {name}',
			workingLanguagesLabel: 'لغات العمل',
			workingLanguagesHint: 'رموز ISO مفصولة بفواصل (مثل ar,fr,en).',
			timezoneLabel: 'المنطقة الزمنية',
			timezoneHint: 'صيغة IANA (مثل Africa/Porto-Novo). اختياري.',
			tooMany: 'الحد الأقصى {max} توجهات. أزل واحداً قبل إضافة آخر.',
			mustPickOne: 'اختر توجهاً واحداً على الأقل.',
			submit: 'حفظ توجهاتي'
		},
		banner: {
			title: 'اختر توجهاتك المهنية',
			subtitle: 'ستبقى قائمتك وتوصيات Skilluv عامة حتى تفعل ذلك.',
			cta: 'اختر الآن'
		},
		softBlock: {
			title: 'هذا القسم يحتاج توجهاتك',
			defaultReason: 'يخصص Skilluv هذه الصفحة حسب التوجهات المهنية التي تختارها. يستغرق 30 ثانية.',
			ctaPrimary: 'اختر الآن',
			ctaLater: 'لاحقاً'
		},
		catalog: {
			title: 'مسارك في Skilluv',
			subtitle: 'اختر من 1 إلى 3 توجهات. سيبني Skilluv قائمتك ومواقع فرقك وشاراتك حولها.',
			loadError: 'تعذر تحميل قائمة التوجهات. حاول لاحقاً.',
			savedTitle: 'تم حفظ التوجهات.',
			savedSubtitle: 'قائمتك المخصصة جاهزة على لوحة التحكم.',
			continueCta: 'الاستمرار إلى لوحة التحكم'
		},
		detail: {
			backToCatalog: 'العودة إلى القائمة',
			primaryDomain: 'المجال الرئيسي',
			secondaryDomains: 'المجالات الثانوية',
			tags: 'المهارات الأساسية',
			playlistTitle: 'معاينة القائمة',
			playlistSubtitle: 'أول 5 عناصر سيقترحها Skilluv إذا اخترت هذا التوجه.',
			playlistEmpty: 'القائمة المخصصة تفتح فور اختيار التوجه.',
			pickCta: 'إضافة إلى اختياري'
		}
	},
	capabilities: {
		sectionOwnTitle: 'كيف أساهم',
		sectionOwnSubtitle: 'أدوارك النشطة على Skilluv. يمكنك التوجيه، والتنسيق، والإشراف بناءً على ما اكتسبته.',
		sectionPublicTitle: 'كيف يساهم هذا الشخص',
		sectionPublicSubtitle: 'أدوار نشطة على Skilluv، تم اكتسابها من خلال الإثباتات.',
		empty: 'لا توجد أدوار نشطة بعد. تابع المساهمة، ستأتي.',
		expiresOn: 'ينتهي في {date}',
		grantedOn: 'مُنح في {date}',
		items: {
			challenger: { label: 'متسابق', description: 'يحل التحديات المنشورة ويكسب الشظايا.' },
			mentor: { label: 'موجّه', description: 'يقود جلسات فردية مع المواهب.' },
			project_steward: { label: 'قائد مشروع', description: 'ينسق مشروعاً مجتمعياً ويحكم بين المواقع.' },
			pr_reviewer: { label: 'مراجع طلبات السحب', description: 'يعتمد طلبات السحب على مكافآت المصادر المفتوحة.' },
			bounty_funder: { label: 'ممول المكافآت', description: 'يمول قضايا GitHub للمجتمع.' },
			issue_proposer: { label: 'مقترح قضايا', description: 'يقترح قضايا لتحويلها إلى مكافآت.' },
			jury_tournament: { label: 'حَكَم بطولة', description: 'يقيّم التسليمات خلال بطولة.' },
			admin: { label: 'مدير', description: 'وصول كامل للمنصة.' },
			enterprise_recruiter: { label: 'موظف مؤسسة', description: 'استقطاب المواهب لحساب مؤسسة.' },
			community_moderator: { label: 'مشرف مجتمع', description: 'يشرف على مساحات المجتمع المشتركة.' },
			forum_moderator: { label: 'مشرف منتدى', description: 'يزيل الرسائل غير المرغوب فيها والإساءات في المنتدى.' },
			plagiarism_reviewer: { label: 'مراجع الانتحال', description: 'يقرر صحة التسليمات المشبوهة.' },
			kyc_reviewer: { label: 'مراجع KYC', description: 'يعتمد وثائق الهوية للمدفوعات.' },
			community_curator: { label: 'منسق المجتمع', description: 'يوافق أو يرفض التحديات المجتمعية قيد المراجعة.' }
		},
		nav: {
			forumModeration: 'إشراف المنتدى',
			pendingCurator: 'قائمة المنسق',
			plagiarismQueue: 'مراجعة الانتحال',
			mentorZone: 'منطقة الموجّه',
			juryTournament: 'حَكَم البطولة'
		}
	}
};
