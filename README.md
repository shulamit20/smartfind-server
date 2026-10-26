# SmartFind Server

שרת REST למערכת "אבידות ומציאות". משתמשים מדווחים על חפץ שאבד, המנהל רושם חפצים שנמצאו, השרת מציע התאמות, והמשתמש מגיש בקשת בעלות שהמנהל מאשר או דוחה.

**טכנולוגיות:** Node.js, Express, TypeScript, PostgreSQL, Prisma, JWT, bcrypt, zod, Swagger.

> **תיעוד אינטראקטיבי:** אחרי שהשרת רץ, אפשר לפתוח את <http://localhost:3000/api/docs>. שם רואים כל endpoint, מה שולחים ומה חוזר, ואפשר לנסות אותו ישירות.

---

## תוכן

1. [הרצה מקומית](#1-הרצה-מקומית)
2. [העלאה ל-Render](#2-העלאה-ל-render)
3. [איך זה עובד – בשפה פשוטה](#3-איך-זה-עובד--בשפה-פשוטה)
4. [טבלת endpoints](#4-טבלת-endpoints)
5. [דוגמאות בקשה ותשובה](#5-דוגמאות-בקשה-ותשובה)
6. [שגיאות](#6-שגיאות)
7. [מבנה הקוד ואיפה משנים דברים](#7-מבנה-הקוד-ואיפה-משנים-דברים)
8. [בדיקות](#8-בדיקות)

---

## 1. הרצה מקומית

**דרישות:** Node.js 20 ומעלה, ו-PostgreSQL שרץ על המחשב.

```bash
# 1. התקנת חבילות
npm install

# 2. יצירת קובץ הגדרות
cp .env.example .env
#    לערוך את .env: להחליף את YOUR_PASSWORD בסיסמה של PostgreSQL,
#    ולשים JWT_SECRET ארוך ו-ADMIN_PASSWORD משלך

# 3. יצירת הטבלאות במסד הנתונים (יוצר גם את ה-DB אם הוא לא קיים)
npm run db:migrate

# 4. מילוי נתונים התחלתיים: אדמין, קטגוריות/צבעים/מיקומים, נתוני דוגמה
npm run db:seed

# 5. הפעלת השרת (מתרענן אוטומטית כשמשנים קוד)
npm run dev
```

השרת רץ על `http://localhost:3000`, וכל ה-API נמצא תחת `/api`.

**משתמשים אחרי ה-seed:**

| תפקיד | אימייל | סיסמה |
|---|---|---|
| Admin | הערך של `ADMIN_EMAIL` ב-`.env` | הערך של `ADMIN_PASSWORD` |
| User (דמו) | `demo@smartfind.local` | `Demo12345` |

> **כל פרטי ההתחברות המקומיים** (כולל סיסמת PostgreSQL) נמצאים בקובץ `LOCAL_CREDENTIALS.md`. הקובץ הזה נשאר רק במחשב ולא עולה לגיט.

**פקודות שימושיות:**

| פקודה | מה עושה |
|---|---|
| `npm run dev` | הפעלת השרת בפיתוח |
| `npm run db:migrate` | יצירת מיגרציה והחלה שלה אחרי שינוי ב-`prisma/schema.prisma` |
| `npm run db:seed` | הרצת ה-seed (בטוח להרצה חוזרת) |
| `npm run db:studio` | ממשק גרפי לצפייה בטבלאות |
| `npm test` | הרצת הבדיקות (צריך `.env.test`, ראו סעיף 8) |
| `npm run build` / `npm start` | בנייה והרצה כמו בפרודקשן |

**חיבור מה-React:** ב-`.env` של השרת, `CLIENT_ORIGIN` צריך להיות הכתובת של הקליינט (ב-Vite זה בדרך כלל `http://localhost:5173`). אחרת הדפדפן יחסום את הבקשות (CORS).

---

## 2. העלאה ל-Render

מסד הנתונים נמצא ב-**Neon** (PostgreSQL), והשרת רץ ב-Render.

### אפשרות א' – Blueprint (הכי פשוט)

1. מעלים את הפרויקט ל-GitHub. `node_modules` ו-`.env` לא עולים, כי הם ב-`.gitignore`.
2. ב-Neon יוצרים מסד נתונים ומעתיקים את כתובת החיבור **הישירה** (בלי `-pooler` בשם השרת, עם `?sslmode=require`).
3. ב-Render: **New → Blueprint** ובוחרים את ה-repository. Render קורא את `render.yaml` ויוצר שירות web בשם `smartfind-server`.
4. Render יבקש למלא את המשתנים שמסומנים `sync: false`:
   - `DATABASE_URL`: כתובת החיבור של Neon מסעיף 2.
   - `CLIENT_ORIGIN`: כתובת הקליינט ב-Render, למשל `https://smartfind-client.onrender.com`. אם הקליינט עוד לא קיים, אפשר לשים זמנית `http://localhost:5173` ולעדכן אחר כך.
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`: פרטי חשבון האדמין. הסיסמה מתעדכנת לפי המשתנה בכל הפעלה.
5. בכל הפעלה השרת מריץ `npm run start:render`, כלומר מיגרציות, אחר כך seed (בטוח להרצה חוזרת, לא מוחק כלום), ואז את השרת. `SEED_SAMPLE_DATA="true"` ב-`render.yaml` מוסיף גם חפצים ומשתמש דמו.
5. בודקים שהכול עובד:
   - `https://<שם-השירות>.onrender.com/api/health` מחזיר `{"status":"ok"}`
   - `https://<שם-השירות>.onrender.com/api/docs` מציג את Swagger

### אפשרות ב' – ידנית

1. ב-Neon יוצרים מסד נתונים ומעתיקים את כתובת החיבור הישירה.
2. **New → Web Service**, ובוחרים את ה-repository:
   - Build Command: `npm install --include=dev && npm run build`
   - Start Command: `npm run start:render`
   - Environment: `DATABASE_URL` (הכתובת מסעיף 1), `JWT_SECRET` (מחרוזת אקראית ארוכה), `JWT_EXPIRES_IN=1d`, `CLIENT_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_ENV=production`, `SEED_SAMPLE_DATA` (`true` או `false`)

**שימו לב:**
- בתוכנית החינמית השרת "נרדם" אחרי זמן בלי שימוש, והבקשה הראשונה אחרי זה לוקחת כחצי דקה.
- גם מסד הנתונים ב-Neon "נרדם" בתוכנית החינמית, ומתעורר לבד בבקשה הבאה.
- ב-React מגדירים את כתובת ה-API כמשתנה סביבה (למשל `VITE_API_URL`), כדי שיהיה קל להחליף בין localhost ל-Render.

---

## 3. איך זה עובד – בשפה פשוטה

### התחברות (Login)
1. המשתמש נרשם (`/auth/register`) או מתחבר (`/auth/login`).
2. השרת בודק את הסיסמה. היא שמורה רק כ-hash של bcrypt, ואף פעם לא כטקסט רגיל.
3. השרת מחזיר **token** (JWT). זו מחרוזת חתומה שבתוכה ה-`userId` וה-`role`.
4. הקליינט שומר את ה-token ושולח אותו בכל בקשה בכותרת:
   `Authorization: Bearer <token>`
5. השרת מאמת את החתימה בכל בקשה. בלי token, או עם token לא תקין, התשובה היא **401**.

### תפקידים (Roles)
- יש שני תפקידים: **User** ו-**Admin**.
- הרשמה תמיד יוצרת `User`. גם אם הקליינט שולח `role: "Admin"`, מתעלמים מזה.
- חשבון האדמין נוצר רק ב-seed, מתוך משתני הסביבה.
- התפקיד נקרא **רק מתוך ה-token** ולא מנתונים שהקליינט שולח.
- משתמש שמנסה פעולה של אדמין מקבל **403**.
- משתמש שמנסה לגשת למשהו של משתמש אחר מקבל **404**, כאילו הרשומה לא קיימת. כך לא חושפים שהיא קיימת.

| מי | מה יכול |
|---|---|
| User | ליצור ולנהל את דיווחי האבדה **שלו**, לחפש בפריטים שנמצאו (רק `Available`), לראות התאמות לדיווחים שלו, להגיש ולראות את בקשות הבעלות **שלו** |
| Admin | לנהל פריטים שנמצאו וטבלאות עזר, לראות, לערוך ולמחוק כל דיווח, לראות את כל הבקשות, לאשר ולדחות |

### התאמות (Matching)
לכל דיווח אבדה השרת משווה מול **כל הפריטים שנמצאו בסטטוס `Available`** ונותן ציון:

| קריטריון | נקודות |
|---|---|
| אותה קטגוריה | 40 |
| אותו צבע | 20 |
| אותו מיקום | 20 |

- חוזרות רק התאמות עם ציון **60 ומעלה**, מהגבוה לנמוך.
- עם הסף הזה, התאמה דורשת אותה קטגוריה ועוד צבע או מיקום.
- **תאריכים לא משפיעים על הציון**, כי חפץ יכול להימצא גם אחרי חודשים. הם משמשים רק לתצוגה ולמיון.
- לכל התאמה חוזר `breakdown` שמראה מה התאים, למשל `{ "category": true, "color": true, "location": false }`.
- ההתאמות מחושבות בכל בקשה ולא נשמרות. דיווח שכבר הוחזר (`Returned`) מקבל רשימה ריקה.
- **התאמה היא רק הצעה.** ההחלטה תמיד של האדמין.
- המשקלים והסף נמצאים בקובץ אחד: `src/config/matching.ts`.

### בקשת בעלות ("זה שלי")
1. המנהל רושם פריט שנמצא, יחד עם **שאלת אימות** ותשובה סודית. למשל: "מה צבע המדבקה?" / "צהוב".
2. המשתמש רואה את הפריט ואת השאלה, אבל **לעולם לא את התשובה**.
3. המשתמש שולח בקשה (`POST /ownership-requests`) עם: הדיווח שלו, הפריט, והתשובה שלו.
   - הדיווח חייב להיות שלו ובסטטוס `Open`.
   - הפריט חייב להיות `Available`.
   - אי אפשר לשלוח שתי בקשות `Pending` על אותו פריט.
4. המנהל רואה בבקשה את השאלה, את תשובת המשתמש ואת התשובה הנכונה, ומחליט.
   - **דחייה:** חייבים לכתוב סיבה (5 תווים לפחות), והמשתמש רואה אותה.
   - **אישור:** קורה בטרנזקציה אחת, כך שהכול מצליח או שכלום לא משתנה:
     - הבקשה עוברת ל-`Approved`
     - הפריט עובר ל-`Returned`
     - הדיווח עובר ל-`Returned`
     - שאר הבקשות הממתינות על אותו פריט נדחות עם הסיבה "This item was returned to another person."
5. השרת **אף פעם** לא מאשר אוטומטית לפי השוואת טקסט.

### סטטוסים
| ישות | ערכים | איך משתנה |
|---|---|---|
| LostReport | `Open` → `Returned` | רק באישור בקשת בעלות |
| FoundItem | `Available` → `Returned` | רק באישור בקשת בעלות |
| OwnershipRequest | `Pending` → `Approved` / `Rejected` | אישור או דחייה של אדמין |

אי אפשר לשנות סטטוס ידנית דרך PUT.

---

## 4. טבלת endpoints

כל הנתיבים מתחילים ב-`/api`. חוץ מ-register ו-login, כולם דורשים token.

### Auth
| Method | Path | גישה | תיאור |
|---|---|---|---|
| POST | `/auth/register` | ציבורי | הרשמה, מחזיר `{ token, user }` |
| POST | `/auth/login` | ציבורי | התחברות, מחזיר `{ token, user }` |
| GET | `/auth/me` | מחובר | המשתמש הנוכחי |

### Lookups (קטגוריות, צבעים, מיקומים)
| Method | Path | גישה | תיאור |
|---|---|---|---|
| GET | `/lookups` | מחובר | `{ categories, colors, locations }` – לרשימות בחירה |
| POST | `/lookups/:type` | Admin | הוספת ערך. `type` הוא `categories`, `colors` או `locations` |
| DELETE | `/lookups/:type/:id` | Admin | מחיקה. אם הערך בשימוש מתקבל 409 |

### Lost reports (דיווחי אבדה)
| Method | Path | גישה | תיאור |
|---|---|---|---|
| GET | `/lost-reports` | מחובר | User: שלו. Admin: הכל. Query: `status, sortBy (createdAt\|lostDate), order, page, pageSize` |
| GET | `/lost-reports/:id` | בעלים / Admin | דיווח אחד |
| POST | `/lost-reports` | User | יצירה |
| PUT | `/lost-reports/:id` | בעלים / Admin | עדכון, רק כשהדיווח `Open` |
| DELETE | `/lost-reports/:id` | בעלים / Admin | מחיקה, רק כשהדיווח `Open`. מוחק גם את הבקשות שלו |
| GET | `/lost-reports/:id/matches` | בעלים / Admin | התאמות עם `score` ו-`breakdown` |

### Found items (פריטים שנמצאו)
| Method | Path | גישה | תיאור |
|---|---|---|---|
| GET | `/found-items` | מחובר | רשימה. Query: `search, categoryId, colorId, locationId, status (Admin), sortBy (createdAt\|foundDate), order, page, pageSize` |
| GET | `/found-items/:id` | מחובר | פריט אחד |
| POST | `/found-items` | Admin | יצירה |
| PUT | `/found-items/:id` | Admin | עדכון |
| DELETE | `/found-items/:id` | Admin | מחיקה. פריט `Returned` אי אפשר למחוק (409). מוחק גם את הבקשות שלו |

### Ownership requests (בקשות בעלות)
| Method | Path | גישה | תיאור |
|---|---|---|---|
| POST | `/ownership-requests` | User | Body: `lostReportId, foundItemId, answer` |
| GET | `/ownership-requests` | מחובר | User: שלו. Admin: הכל. Query: `status, order, page, pageSize` |
| GET | `/ownership-requests/:id` | בעלים / Admin | בקשה אחת |
| PATCH | `/ownership-requests/:id/approve` | Admin | אישור |
| PATCH | `/ownership-requests/:id/reject` | Admin | Body: `rejectionReason` |

### נוספים
| Method | Path | תיאור |
|---|---|---|
| GET | `/health` | בדיקת חיים, מחזיר `{ "status": "ok" }` |
| GET | `/docs` | Swagger UI |
| GET | `/docs.json` | מסמך OpenAPI גולמי |

---

## 5. דוגמאות בקשה ותשובה

כל התאריכים חוזרים בפורמט ISO, למשל `"2026-10-01T00:00:00.000Z"`. בבקשות אפשר לשלוח `"2026-10-01"`.

### הרשמה
`POST /api/auth/register`
```json
{ "fullName": "Dana Cohen", "email": "dana@example.com", "password": "Password123" }
```
`201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 3, "fullName": "Dana Cohen", "email": "dana@example.com", "role": "User", "createdAt": "2026-10-08T12:00:00.000Z" }
}
```

### התחברות
`POST /api/auth/login`
```json
{ "email": "dana@example.com", "password": "Password123" }
```
`200 OK`: אותו מבנה כמו בהרשמה. אם הפרטים שגויים מתקבל `401` עם `"Invalid email or password"`.

### טבלאות עזר
`GET /api/lookups`
```json
{
  "categories": [{ "id": 1, "name": "Bags" }, { "id": 2, "name": "Wallets" }],
  "colors": [{ "id": 1, "name": "Black" }],
  "locations": [{ "id": 2, "name": "Library" }]
}
```

`POST /api/lookups/categories` (Admin)
```json
{ "name": "Umbrellas" }
```
`201 Created`: `{ "id": 10, "name": "Umbrellas" }`

### יצירת דיווח אבדה
`POST /api/lost-reports`
```json
{
  "title": "Lost black backpack",
  "description": "Black backpack with a yellow sticker",
  "categoryId": 1,
  "colorId": 1,
  "locationId": 2,
  "lostDate": "2026-10-01"
}
```
`201 Created`
```json
{
  "id": 5,
  "title": "Lost black backpack",
  "description": "Black backpack with a yellow sticker",
  "category": { "id": 1, "name": "Bags" },
  "color": { "id": 1, "name": "Black" },
  "location": { "id": 2, "name": "Library" },
  "lostDate": "2026-10-01T00:00:00.000Z",
  "status": "Open",
  "createdAt": "2026-10-08T12:00:00.000Z",
  "owner": { "id": 3, "fullName": "Dana Cohen" }
}
```

### רשימה עם עימוד
`GET /api/found-items?search=backpack&categoryId=1&sortBy=foundDate&order=desc&page=1&pageSize=10`
```json
{
  "items": [
    {
      "id": 12,
      "title": "Black backpack",
      "description": "Black backpack found near the library entrance",
      "category": { "id": 1, "name": "Bags" },
      "color": { "id": 1, "name": "Black" },
      "location": { "id": 2, "name": "Library" },
      "foundDate": "2026-10-06T00:00:00.000Z",
      "verificationQuestion": "What color is the sticker on the bag?",
      "status": "Available",
      "createdAt": "2026-10-06T09:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10
}
```
לאדמין חוזר גם `"verificationAnswer": "Yellow"`. משתמש רגיל לא מקבל אותו אף פעם.

### יצירת פריט שנמצא (Admin)
`POST /api/found-items`
```json
{
  "title": "Black backpack",
  "description": "Black backpack found near the library entrance",
  "categoryId": 1,
  "colorId": 1,
  "locationId": 2,
  "foundDate": "2026-10-06",
  "verificationQuestion": "What color is the sticker on the bag?",
  "verificationAnswer": "Yellow"
}
```
`201 Created`: הפריט בצורת האדמין, כלומר כולל `verificationAnswer`.

### התאמות
`GET /api/lost-reports/5/matches`
```json
[
  {
    "foundItem": { "id": 12, "title": "Black backpack", "...": "שאר השדות הציבוריים" },
    "score": 80,
    "breakdown": { "category": true, "color": true, "location": true }
  }
]
```

### בקשת בעלות
`POST /api/ownership-requests`
```json
{ "lostReportId": 5, "foundItemId": 12, "answer": "Yellow" }
```
`201 Created` (מה שהמשתמש רואה)
```json
{
  "id": 7,
  "status": "Pending",
  "verificationQuestion": "What color is the sticker on the bag?",
  "answer": "Yellow",
  "rejectionReason": null,
  "reviewedAt": null,
  "createdAt": "2026-10-08T12:30:00.000Z",
  "lostReport": { "id": 5, "title": "Lost black backpack", "status": "Open" },
  "foundItem": { "id": 12, "title": "Black backpack", "status": "Available" }
}
```

`GET /api/ownership-requests/7` (מה שהאדמין רואה: אותו מבנה ועוד שני שדות)
```json
{
  "...": "כל השדות שלמעלה",
  "correctAnswer": "Yellow",
  "user": { "id": 3, "fullName": "Dana Cohen", "email": "dana@example.com" }
}
```

### אישור / דחייה (Admin)
`PATCH /api/ownership-requests/7/approve` (בלי body). מחזיר `200` עם הבקשה ב-`"status": "Approved"` ו-`reviewedAt` מלא.

`PATCH /api/ownership-requests/7/reject`
```json
{ "rejectionReason": "The answer does not match the item." }
```
מחזיר `200` עם הבקשה ב-`"status": "Rejected"` ועם הסיבה.

### מחיקה
`DELETE /api/lost-reports/5` מחזיר `204 No Content` בלי גוף תשובה.

---

## 6. שגיאות

כל השגיאות חוזרות באותו מבנה:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid request", "details": [{ "path": "email", "message": "Invalid email address" }] } }
```

| Status | code | מתי |
|---|---|---|
| 400 | `VALIDATION_ERROR` | שדה חסר או לא תקין, **שדה לא מוכר**, JSON שבור, id של קטגוריה/צבע/מיקום שלא קיים |
| 401 | `UNAUTHORIZED` | אין token, token לא תקין או פג תוקף, אימייל או סיסמה שגויים |
| 403 | `FORBIDDEN` | התפקיד לא מתאים (למשל User שמנסה ליצור פריט שנמצא) |
| 404 | `NOT_FOUND` | לא קיים, **או שייך למשתמש אחר** |
| 409 | `CONFLICT` | אימייל תפוס, בקשה ממתינה כפולה, שינוי דיווח שכבר הוחזר, מחיקת ערך עזר שבשימוש, וכו' |
| 429 | `TOO_MANY_REQUESTS` | יותר מדי ניסיונות login/register (20 ב-15 דקות) |
| 500 | `INTERNAL_ERROR` | תקלה בשרת. פרטים טכניים לא נשלחים לקליינט |

---

## 7. מבנה הקוד ואיפה משנים דברים

```
prisma/
  schema.prisma     טבלאות + ערכי הסטטוס
  seed.ts           אדמין, טבלאות עזר, נתוני דוגמה
src/
  app.ts            הרכבת השרת: middlewares + נתיבים
  server.ts         הפעלה
  config/           env, הגדרות התאמה, קבועים
  lib/              prisma, jwt, errors, pagination, validation
  middleware/       authenticate, requireRole, rateLimit, errorHandler
  docs/             Swagger / OpenAPI
  modules/<entity>/
    *.routes.ts       נתיב + הרשאת תפקיד
    *.controller.ts   קורא את הבקשה (ולידציה עם zod) ומחזיר תשובה
    *.service.ts      חוקי העסק – בעלות, סטטוסים, טרנזקציות
    *.schemas.ts      סכמות zod (ולידציה + תיעוד)
    *.mapper.ts       מה בדיוק נשלח לקליינט
    *.docs.ts         רישום ה-endpoints ב-Swagger
tests/              בדיקות
```

**מסלול בקשה:** `routes → authenticate / requireRole → controller → service → Prisma → mapper → JSON`

| רוצים לשנות... | איפה |
|---|---|
| משקלי ההתאמה או הסף | `src/config/matching.ts` |
| קטגוריות, צבעים, מיקומים | דרך ה-API (`/lookups`) או ב-seed. לא צריך לשנות קוד |
| להוסיף שדה לישות | `prisma/schema.prisma` + `*.schemas.ts` + `*.mapper.ts`, ואז `npm run db:migrate` |
| ערכי סטטוס | `prisma/schema.prisma` (מיוצאים דרך `src/config/constants.ts`) |
| גודל עמוד ברירת מחדל, אורך סיסמה מינימלי | `src/config/constants.ts` |

---

## 8. בדיקות

- `tests/matching.test.ts`: חישוב ההתאמה (בלי מסד נתונים).
- `tests/access.test.ts`: חוקי הרשאה מול **מסד נתונים נפרד לבדיקות**:
  - משתמש לא יכול לקרוא, לערוך או למחוק נתונים של משתמש אחר
  - משתמש רגיל לעולם לא מקבל `verificationAnswer`
  - רק אדמין מנהל פריטים ומאשר או דוחה בקשות
  - זרימת האישור המלאה

```bash
cp .env.test.example .env.test   # ולעדכן סיסמה. שם ה-DB חייב לכלול "test"
npm test                          # מחיל מיגרציות על DB הבדיקות ומריץ את הבדיקות
```

הבדיקות מוחקות את כל הנתונים ב-DB הבדיקות בהתחלה ובסוף. לכן הן מסרבות לרוץ אם שם ה-DB לא כולל "test".
