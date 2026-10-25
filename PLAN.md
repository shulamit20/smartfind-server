# SmartFind Server – תוכנית עבודה (לאישור לפני כתיבת קוד)

המסמך הזה מבוסס על `../דרישות הפרויקט/characterization.md` ועל דף דרישות הקורס (3 התמונות באותה תיקייה).
לפי סעיף 14 באפיון: קודם מציגים תוכנית (מבנה תיקיות + סכמת DB) ושאלות פתוחות, ורק אחרי אישור כותבים קוד.

---

## הוראות עבודה (מהסטודנט/ית)

```
Important instructions:

- Build ONLY the backend/server.
- I will build the React + TypeScript frontend myself.
- Do not create or modify any React/frontend code.
- I do not need to deeply learn the Node.js syntax right now. The important thing is that the server works correctly and exposes a clear API that I can use from React later.
- Keep the server simple, readable, modular, and easy to change later.
- Make the implementation flexible/dynamic: things that may change later (such as matching weights, matching threshold, date window, categories, colors, and locations) should not be unnecessarily hardcoded throughout the code. Keep such logic/configuration centralized so changes can be made locally.
- Add Swagger / OpenAPI for the server so I can view and test the API and understand the requests and responses when I later build the React client.
- Do not build a complicated or oversized system. Keep it proportional to a student course project.

Workflow:
1. Read the full specification and the instructor requirements/images I provide.
2. Before writing code, show me a short plan:
   - folder structure
   - database schema and relationships
   - main services
   - main API endpoints
   - authentication/authorization approach
   - matching logic
3. Wait for my approval of this overall plan.
4. After I approve it, proceed with the implementation without asking for approval for every small step.
5. If you encounter an important ambiguity or a major design change that would significantly affect the project, stop and ask me before making that change.
6. Do not create Git commits or push to GitHub unless I explicitly ask.

The main goal is a working, clear backend that will be easy for me to connect to and learn React against later.
```

---

## 0. דרישות הקורס (מהתמונות) – ואיך השרת עונה עליהן

| דרישת הקורס | איך זה מכוסה בשרת |
|---|---|
| כניסה למערכת | `POST /auth/register`, `POST /auth/login`, JWT |
| שני סוגי משתמשים עם הרשאות שונות | `User` / `Admin`, בדיקת תפקיד ב-middleware |
| אובייקט מרכזי אחד לפחות | `FoundItem` (וגם `LostReport`) |
| רשימת אובייקטים, הוספה ועריכה | `GET/POST/PUT /found-items`, `/lost-reports` |
| לפחות 5 שדות משמעותיים באובייקט | ל-`FoundItem` יש title, description, category, color, location, foundDate, status ועוד |
| קטגוריה / סוג / סטטוס או שדה בחירה אחר | קטגוריה, צבע, מיקום (טבלאות עזר) + status |
| חיפוש, סינון או מיון | `GET /found-items?search=&categoryId=&sortBy=&order=&page=` |
| מידע שמגיע מהשרת ונשמר במסד נתונים | PostgreSQL דרך Prisma |
| "מנהל רואה את כל הרשומות; משתמש רגיל רואה את שלו ואת הציבוריות" | אדמין רואה את כל הדיווחים והבקשות. משתמש רואה רק את הדיווחים והבקשות שלו, ואת רשימת הפריטים שנמצאו (הרשומות הציבוריות) |
| **שרת – מותר AI**, אבל צריך לדעת להסביר: לאיזה API ה-React פונה, מה נשלח, מה חוזר, איך המידע נשמר, איך עובדות התחברות והרשאות | קוד פשוט עם הערות. ב-README יש טבלת endpoints עם דוגמאות בקשה ותשובה, והסבר בשפה פשוטה |
| **צד React – בלי AI** (קומפוננטות, Hooks, Routing, Forms, React Query, Redux/Context) | לא כותבים שום קוד לקליינט, רק תיעוד ה-API |
| הגשה: קישור לגיט **בלי node_modules** | קובץ `.gitignore` עם `node_modules` ו-`.env` |
| הגשה: להעלות לענן (Render) **שרת, DB וגם CLIENT** | `render.yaml` + הוראות ב-README. `CLIENT_ORIGIN` מקבל את כתובת הקליינט ב-Render, כדי ש-CORS יאפשר לו לפנות לשרת |
| "עדיף פרויקט קטן ומסודר שעובד היטב" | שומרים על פשטות, בלי שכבות ותשתיות מיותרות |

> את ההערות בכתב יד בפינה של העמוד הראשון לא הצלחתי לקרוא. אם יש בהן משהו שקשור לשרת, כדאי לכתוב אותו כאן.

---

## 1. טכנולוגיות (כמו באפיון + Swagger)

| תחום | בחירה |
|---|---|
| שרת | Node.js + Express + TypeScript |
| מסד נתונים | PostgreSQL + Prisma ORM |
| התחברות | JWT ב-`Authorization: Bearer <token>` |
| סיסמאות | bcrypt |
| ולידציה | zod |
| אבטחה | helmet, cors, express-rate-limit |
| תיעוד API | Swagger UI (`swagger-ui-express`) + OpenAPI שנוצר מסכמות ה-zod (`@asteasolutions/zod-to-openapi`) |
| בדיקות | Vitest + Supertest |
| העלאה לאוויר | Render (Web Service + PostgreSQL) |

---

## 2. מבנה תיקיות

```
SmartFind-Server/
├── prisma/
│   ├── schema.prisma          # הגדרת הטבלאות
│   ├── migrations/            # נוצר אוטומטית ע"י prisma migrate
│   └── seed.ts                # אדמין + טבלאות עזר + נתוני דוגמה (בטוח להרצה חוזרת)
├── src/
│   ├── server.ts              # נקודת כניסה: מאזין לפורט
│   ├── app.ts                 # יצירת אפליקציית Express (middlewares + routes) – נפרד כדי שהבדיקות יוכלו לייבא
│   ├── config/
│   │   ├── env.ts             # קריאת משתני סביבה ובדיקה שהם קיימים (zod)
│   │   ├── matching.ts        # משקלים וסף ההתאמה – במקום אחד
│   │   └── constants.ts       # ערכי סטטוס ותפקידים – במקום אחד
│   ├── lib/
│   │   ├── prisma.ts          # מופע יחיד של PrismaClient
│   │   ├── jwt.ts             # יצירה ואימות של טוקן
│   │   ├── errors.ts          # מחלקת AppError + פונקציות עזר (notFound, conflict...)
│   │   └── pagination.ts      # עימוד/מיון/סינון – מימוש אחד לשימוש חוזר
│   ├── docs/
│   │   └── openapi.ts         # בניית מסמך ה-OpenAPI מסכמות ה-zod של המודולים
│   ├── middleware/
│   │   ├── authenticate.ts    # בודק JWT ושם את המשתמש ב-req.user
│   │   ├── requireRole.ts     # בודק תפקיד (Admin / User) לפי ה-JWT בלבד
│   │   ├── validate.ts        # מריץ סכמות zod על body / query / params
│   │   ├── rateLimit.ts       # הגבלת קצב ל-login ו-register
│   │   └── errorHandler.ts    # מחזיר שגיאה בפורמט אחיד, בלי stack trace
│   ├── modules/               # כל ישות בתיקייה משלה, באותו מבנה שכבות
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schemas.ts      # zod
│   │   │   └── auth.mapper.ts       # מה מוחזר ללקוח (בלי passwordHash)
│   │   ├── lookups/          (אותו מבנה)
│   │   ├── lostReports/      (אותו מבנה + matching.service.ts)
│   │   ├── foundItems/       (אותו מבנה; mapper עם צורה ציבורית וצורת אדמין)
│   │   └── ownershipRequests/(אותו מבנה)
│   └── types/
│       └── express.d.ts       # הוספת req.user לטיפוסים של Express
├── tests/
│   ├── matching.test.ts       # בדיקות יחידה לחישוב ההתאמה (בלי DB)
│   └── access.test.ts         # בדיקות הרשאות מול DB נפרד לבדיקות (ראו סעיף 8.8)
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── render.yaml                # הגדרת Render (שירות + DB)
└── README.md
```

**זרימת בקשה:** `routes → (middleware: auth, role, validate) → controller → service → prisma`
- **routes** – רק נתיב + אילו middlewares רצים.
- **controller** – לוקח נתונים מה-request, קורא ל-service, מחזיר תשובה דרך ה-mapper.
- **service** – כל חוקי העסק (בעלות, סטטוסים, טרנזקציות). רק כאן.
- **mapper** – בוחר במפורש אילו שדות יוצאים ללקוח. כך `verificationAnswer` ו-`passwordHash` לא יכולים "לדלוף בטעות".

---

## 3. סכמת מסד הנתונים (Prisma)

```prisma
enum Role                   { User  Admin }
enum LostReportStatus       { Open  Returned }
enum FoundItemStatus        { Available  Returned }
enum OwnershipRequestStatus { Pending  Approved  Rejected }

model User {
  id           Int      @id @default(autoincrement())
  fullName     String
  email        String   @unique          // נשמר באותיות קטנות
  passwordHash String
  role         Role     @default(User)
  createdAt    DateTime @default(now())

  lostReports       LostReport[]
  ownershipRequests OwnershipRequest[]
}

model Category {
  id         Int      @id @default(autoincrement())
  name       String   @unique
  createdAt  DateTime @default(now())
  lostReports LostReport[]
  foundItems  FoundItem[]
}
// Color, Location – זהים ל-Category

model LostReport {
  id          Int              @id @default(autoincrement())
  userId      Int
  title       String
  description String
  categoryId  Int
  colorId     Int
  locationId  Int
  lostDate    DateTime
  status      LostReportStatus @default(Open)
  createdAt   DateTime         @default(now())

  user     User     @relation(fields: [userId], references: [id])
  category Category @relation(fields: [categoryId], references: [id])  // onDelete: Restrict
  color    Color    @relation(fields: [colorId], references: [id])
  location Location @relation(fields: [locationId], references: [id])
  ownershipRequests OwnershipRequest[]
}

model FoundItem {
  id                   Int             @id @default(autoincrement())
  title                String
  description          String
  categoryId           Int
  colorId              Int
  locationId           Int
  foundDate            DateTime
  verificationQuestion String
  verificationAnswer   String          // מוסתר – רק לאדמין
  status               FoundItemStatus @default(Available)
  createdAt            DateTime        @default(now())
  // + relations כמו ב-LostReport
  ownershipRequests OwnershipRequest[]
}

model OwnershipRequest {
  id              Int                    @id @default(autoincrement())
  userId          Int
  lostReportId    Int
  foundItemId     Int
  answer          String
  status          OwnershipRequestStatus @default(Pending)
  rejectionReason String?
  reviewedAt      DateTime?
  createdAt       DateTime               @default(now())

  user       User       @relation(fields: [userId], references: [id])
  lostReport LostReport @relation(fields: [lostReportId], references: [id])
  foundItem  FoundItem  @relation(fields: [foundItemId], references: [id])
}
```

הערות:
- **מזהים** – מספרים רצים (`Int`), כמו בדוגמה באפיון (`"id": 12`).
- **טבלאות עזר** – `onDelete: Restrict`, כך שאי אפשר למחוק קטגוריה/צבע/מיקום שבשימוש (השרת יחזיר 409).
- **"רק בקשה Pending אחת לאותו משתמש ואותו פריט"** – נבדק ב-service (Prisma לא תומך באינדקס ייחודי חלקי בלי SQL ידני). אם רוצים, אפשר להוסיף אינדקס חלקי במיגרציה כהגנה נוספת.
- **אישור בקשה** – `prisma.$transaction` אחד שמעדכן את 4 הדברים שבאפיון.
- **מחיקת בקשות קשורות** (החלטה 8.2) – מחיקת הבקשות והדיווח/הפריט מתבצעת ב-service בתוך טרנזקציה אחת, כך שרואים בקוד בדיוק מה נמחק.

---

## 4. השירותים המרכזיים (services – שם נמצאים חוקי העסק)

| Service | אחריות |
|---|---|
| `auth.service` | הרשמה (תמיד `User`, אימייל באותיות קטנות, bcrypt), התחברות (הודעת שגיאה אחידה שלא מגלה אם האימייל קיים), החזרת המשתמש הנוכחי |
| `lookups.service` | קריאת קטגוריות/צבעים/מיקומים, הוספה, מחיקה רק אם הערך לא בשימוש (אחרת 409) |
| `foundItems.service` | CRUD לאדמין, רשימה עם חיפוש/סינון/מיון/עימוד (משתמש רגיל רואה רק `Available`), איסור מחיקת פריט `Returned`, מחיקת כל הבקשות הקשורות |
| `lostReports.service` | משתמש: רק הדיווחים שלו (אחר → 404). אדמין: צפייה/עריכה/מחיקה של כל דיווח. עריכה/מחיקה רק כש-`Open`. מחיקה מוחקת את כל הבקשות הקשורות |
| `matching.service` | חישוב התאמות לדיווח (פונקציה טהורה + שליפת פריטים זמינים) |
| `ownershipRequests.service` | יצירת בקשה (כל הבדיקות מהאפיון), אישור בטרנזקציה, דחייה עם סיבה |

---

## 5. ה-API (כל הנתיבים תחת `/api`)

| Method | Path | מי | מה |
|---|---|---|---|
| POST | `/auth/register` | ציבורי | `{fullName,email,password}` → `{token,user}` (שדה `role` נשלח → מתעלמים) |
| POST | `/auth/login` | ציבורי | `{email,password}` → `{token,user}` |
| GET | `/auth/me` | מחובר | המשתמש הנוכחי |
| GET | `/lookups` | מחובר | `{categories,colors,locations}` |
| POST | `/lookups/:type` | Admin | הוספת ערך `{name}` |
| DELETE | `/lookups/:type/:id` | Admin | מחיקה (409 אם בשימוש) |
| GET | `/lost-reports` | מחובר | משתמש: שלו. אדמין: הכל |
| GET | `/lost-reports/:id` | בעלים/Admin | דיווח אחד |
| POST | `/lost-reports` | User | יצירה (אדמין → 403) |
| PUT | `/lost-reports/:id` | בעלים/Admin | עדכון (רק `Open`, בלי `status`) |
| DELETE | `/lost-reports/:id` | בעלים/Admin | מחיקה (רק `Open`) |
| GET | `/lost-reports/:id/matches` | בעלים/Admin | התאמות עם ציון ו-breakdown (דיווח `Returned` → `[]`) |
| GET | `/found-items` | מחובר | רשימה: `search, categoryId, colorId, locationId, status, sortBy, order, page, pageSize` → `{items,total,page,pageSize}` |
| GET | `/found-items/:id` | מחובר | פריט אחד (בלי תשובת אימות למשתמש רגיל) |
| POST / PUT / DELETE | `/found-items[/:id]` | Admin | ניהול פריטים (בלי `status` ב-PUT) |
| POST | `/ownership-requests` | User | `{lostReportId,foundItemId,answer}` |
| GET | `/ownership-requests` | מחובר | משתמש: שלו. אדמין: הכל + `?status=` |
| GET | `/ownership-requests/:id` | בעלים/Admin | בקשה אחת (לאדמין: שאלה + תשובת המשתמש + התשובה הנכונה) |
| PATCH | `/ownership-requests/:id/approve` | Admin | אישור |
| PATCH | `/ownership-requests/:id/reject` | Admin | `{rejectionReason}` (5 תווים לפחות) |

**Swagger:** `GET /api/docs` – ממשק לצפייה ובדיקת כל הנתיבים (כולל כפתור Authorize להדבקת ה-JWT). `GET /api/docs.json` – מסמך ה-OpenAPI הגולמי.
המסמך נבנה מאותן סכמות zod שמשמשות לוולידציה, כך שהתיעוד לא "מתיישן" כשמשנים שדה.

---

## 6. התחברות והרשאות

1. **הרשמה/התחברות** – השרת בודק סיסמה מול ה-hash (bcrypt) ומחזיר `token` (JWT) בגוף התשובה. בתוך הטוקן: `userId` ו-`role`. תוקף לפי `JWT_EXPIRES_IN`.
2. **כל בקשה אחרת** – הקליינט שולח `Authorization: Bearer <token>`. ה-middleware `authenticate` מאמת את הטוקן ושם `req.user = { id, role }`. אין טוקן/לא תקין → 401.
3. **בדיקת תפקיד** – `requireRole('Admin')` או `requireRole('User')` על הנתיב. תפקיד לא מתאים → 403. התפקיד נלקח רק מהטוקן, אף פעם לא מהבקשה.
4. **בדיקת בעלות** – ב-service: למשתמש רגיל השליפה היא `where: { id, userId }`; לאדמין `where: { id }`. לא נמצא / לא שלו → 404 (לא 403, כדי לא לחשוף שהרשומה קיימת).
5. **הסתרת מידע** – mappers נפרדים: `toPublicFoundItem` (בלי `verificationAnswer`) ו-`toAdminFoundItem`. `passwordHash` לעולם לא יוצא.
6. **הגנות נוספות** – helmet, CORS רק ל-`CLIENT_ORIGIN`, rate limit על login/register, error handler שלא מחזיר stack trace.

---

## 7. לוגיקת ההתאמה (מעודכן – בלי תאריך)

כל הערכים בקובץ אחד – `src/config/matching.ts`:

```ts
export const matchingConfig = {
  weights: { category: 40, color: 20, location: 20 },
  minScore: 60,
};
```

אלגוריתם (`GET /lost-reports/:id/matches`):
1. שליפת הדיווח (בדיקת בעלות/אדמין). אם הוא `Returned` → מחזירים `[]` מיד.
2. שליפת כל הפריטים בסטטוס `Available`.
3. לכל פריט: `breakdown = { category, color, location }` (true/false), והציון = סכום המשקלים של מה ש-true.
4. סינון `score >= minScore`, מיון מהגבוה לנמוך.
5. החזרה: `[{ foundItem (שדות ציבוריים), score, breakdown }]`.

- **התאריכים לא משפיעים על הציון.** `lostDate` ו-`foundDate` נשמרים ומוחזרים לתצוגה, מיון וסינון בלבד.
- הקריטריונים נגזרים מהמפתחות של `weights`, כך שהוספה/הסרה של קריטריון = שינוי בקובץ ה-config + פונקציית השוואה אחת.
- **שימו לב:** בלי התאריך, הציון המקסימלי הוא 80. עם סף 60 – התאמה תופיע רק אם **הקטגוריה זהה** ובנוסף הצבע או המיקום זהים (צבע + מיקום בלי קטגוריה = 40 בלבד). אם רוצים התנהגות אחרת, משנים רק את `minScore` או את המשקלים.

פונקציית החישוב טהורה (בלי DB), ולכן קלה לבדיקה ביחידה. ההתאמה היא רק הצעה, ההחלטה תמיד אצל האדמין.

---

## 8. החלטות על הנקודות הלא חד-משמעיות (סופי)

1. **שדות לא מוכרים ו-`role` בהרשמה** – מאושר.
   - שדה לא מוכר → 400.
   - חריג: `role` בהרשמה – מתעלמים ממנו.
   - הרשמה תמיד יוצרת `User` רגיל. אי אפשר ליצור Admin מהקליינט.

2. **מחיקת דיווח/פריט עם בקשות ישנות** – מאושר.
   - מחיקת `LostReport` או `FoundItem` מוחקת את **כל** ה-`OwnershipRequest` הקשורות (גם `Pending` וגם `Rejected`).

3. **התאמה ותאריכים** – **שינוי חשוב.**
   - קריטריון התאריך הוסר לגמרי מהציון. אין חוק 7 ימים.
   - חפץ יכול להימצא אחרי ימים, חודשים או אפילו שנה.
   - `lostDate` ו-`foundDate` נשמרים וזמינים לתצוגה, מיון וסינון, אבל לא משפיעים על הציון.

4. **הרשאות אדמין על LostReports** – שינוי מההצעה המקורית.
   - משתמש רגיל עורך/מוחק רק את הדיווחים שלו.
   - אדמין יכול לצפות, לערוך ולמחוק דיווחים של כל משתמש.
   - אדמין לא יוצר דיווחים בשם משתמשים (אלא אם יתווסף בעתיד) → 403.
   - משתמש רגיל שניגש לדיווח של משתמש אחר → 404.
   - פעולה של אדמין בלבד שמשתמש רגיל מנסה → 403.

5. **שינויי סטטוס** – מאושר.
   - הלקוח לא יכול לשנות `status` ידנית. אין `status` בסכמות ה-PUT.
   - סטטוסים משתנים רק דרך זרימת העבודה של המערכת (אישור בקשת בעלות).

6. **פריטים שנמצאו – מה רואה משתמש רגיל** – שינוי.
   - משתמש רגיל רואה ברשימה רק פריטים בסטטוס `Available`. פריטים `Returned` לא מופיעים בחיפוש/רשימה הרגילים.
   - פילטר `status` אופציונלי – לאדמין (ברירת מחדל לאדמין: כל הסטטוסים).

7. **התאמות לדיווח `Returned`** – מאושר.
   - מחזירים רשימה ריקה, בלי לחשב.

8. **בדיקות הרשאות/אינטגרציה** – מאושר.
   - מסד נתונים נפרד לבדיקות (`.env.test`).
   - הבדיקות יוצרות את הנתונים של עצמן ומנקות אחריהן.
   - נבדק לפחות:
     - משתמש לא יכול לקרוא מידע פרטי של משתמש אחר
     - משתמש לא יכול לערוך/למחוק `LostReport` של משתמש אחר
     - משתמש שאינו אדמין לעולם לא מקבל `verificationAnswer`
     - רק אדמין מנהל `FoundItems` ומאשר/דוחה בקשות בעלות

---

## 9. סדר העבודה אחרי אישור

1. אתחול פרויקט: `package.json`, TypeScript, Prisma, `.env.example`, `.gitignore`
2. סכמה + מיגרציה ראשונה + seed
3. תשתית: env, errors, middlewares, pagination
4. מודולים לפי הסדר: auth → lookups → found-items → lost-reports + matching → ownership-requests
5. Swagger / OpenAPI (`/api/docs`)
6. בדיקות (matching + הרשאות)
7. `README.md` מלא (הרצה מקומית, Render, טבלת endpoints עם דוגמאות, הסבר פשוט) + `render.yaml`
