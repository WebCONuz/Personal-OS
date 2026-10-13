import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { createBrowserRouter, Link } from "react-router";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { AppLayout } from "../layouts/AppLayout";
import { SectionLayout } from "../layouts/SectionLayout";
import { RouteError } from "./RouteError";

/** Lazy-load a named export so each section ships as its own chunk. */
function page<M extends Record<string, unknown>>(
  loader: () => Promise<M>,
  name: keyof M,
): ReactNode {
  const Component = lazy(async () => ({
    default: (await loader())[name] as ComponentType,
  }));
  return (
    <Suspense fallback={<div className="min-h-40" aria-busy="true" />}>
      <Component />
    </Suspense>
  );
}

const dashboard = () => import("@/features/dashboard/components/DashboardPage");
const goals = () => import("@/features/goals/components/GoalsPage");
const goalDetail = () => import("@/features/goals/components/GoalDetailPage");
const weekly = () =>
  import("@/features/weekly-planning/components/WeeklyPlanPage");
const today = () => import("@/features/weekly-planning/components/TodayPage");
const tasks = () => import("@/features/tasks/components/TasksPage");
const time = () =>
  import("@/features/time-tracking/components/TimeTrackingPage");
const reviews = () => import("@/features/reviews/components/ReviewsPage");
const weeklyReview = () =>
  import("@/features/reviews/components/WeeklyReviewPage");
const career = () => import("@/features/career/components/CareerPages");
const projects = () => import("@/features/projects/components/ProjectsPage");
const projectDetail = () =>
  import("@/features/projects/components/ProjectDetailPage");
const business = () => import("@/features/business/components/BusinessPages");
const learning = () => import("@/features/learning/components/LearningPages");
const knowledge = () => import("@/features/knowledge/components/KnowledgePage");
const finance = () => import("@/features/finance/components/FinancePages");
const habits = () => import("@/features/habits/components/HabitsPage");
const lifestyle = () =>
  import("@/features/lifestyle/components/LifestylePages");
const analytics = () => import("@/features/analytics/components/AnalyticsPage");
const settings = () => import("@/features/settings/components/SettingsPage");
const welcome = () => import("@/features/settings/components/WelcomePage");

function NotFound() {
  return (
    <EmptyState
      title="Sahifa topilmadi"
      description="Havola noto‘g‘ri yoki sahifa ko‘chirilgan."
      action={
        <Button asChild>
          <Link to="/">Dashboard’ga qaytish</Link>
        </Button>
      }
    />
  );
}

export const router = createBrowserRouter([
  {
    path: "/welcome",
    element: page(welcome, "WelcomePage"),
    errorElement: <RouteError />,
  },
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: page(dashboard, "DashboardPage") },
      { path: "goals", element: page(goals, "GoalsPage") },
      { path: "goals/:goalId", element: page(goalDetail, "GoalDetailPage") },
      {
        path: "planning",
        element: (
          <SectionLayout
            title="Rejalashtirish"
            description="Haftalik natijalarni tanlang, kunlarga taqsimlang va haftani tahlil qiling."
            tabs={[
              { to: "/planning", label: "Haftalik reja", end: true },
              { to: "/planning/today", label: "Bugun" },
              { to: "/planning/tasks", label: "Vazifalar" },
              { to: "/planning/time", label: "Vaqt kuzatuvi" },
              { to: "/planning/reviews", label: "Review" },
            ]}
          />
        ),
        children: [
          { index: true, element: page(weekly, "WeeklyPlanPage") },
          { path: "today", element: page(today, "TodayPage") },
          { path: "tasks", element: page(tasks, "TasksPage") },
          { path: "time", element: page(time, "TimeTrackingPage") },
          { path: "reviews", element: page(reviews, "ReviewsPage") },
        ],
      },
      {
        path: "planning/reviews/:weekStart",
        element: page(weeklyReview, "WeeklyReviewPage"),
      },
      {
        path: "career",
        element: (
          <SectionLayout
            title="Karyera"
            description="Ko‘nikmalar, ko‘rinadigan natijalar va ish imkoniyatlari."
            tabs={[
              { to: "/career", label: "Ko‘nikmalar", end: true },
              { to: "/career/directions", label: "O‘rganish yo‘nalishlari" },
              { to: "/career/achievements", label: "Yutuqlar" },
              { to: "/career/jobs", label: "Ish imkoniyatlari" },
            ]}
          />
        ),
        children: [
          { index: true, element: page(career, "SkillsPage") },
          {
            path: "directions",
            element: page(career, "LearningDirectionsPage"),
          },
          { path: "achievements", element: page(career, "AchievementsPage") },
          { path: "jobs", element: page(career, "JobsPage") },
        ],
      },
      {
        path: "business",
        element: (
          <SectionLayout
            title="Biznes va loyihalar"
            description="Loyihalar, g‘oyalar va mijozlar — kamroq parallel ish, ko‘proq natija."
            tabs={[
              { to: "/business", label: "Loyihalar", end: true },
              { to: "/business/ideas", label: "G‘oyalar" },
              { to: "/business/contacts", label: "Mijozlar" },
            ]}
          />
        ),
        children: [
          { index: true, element: page(projects, "ProjectsPage") },
          { path: "ideas", element: page(business, "IdeasPage") },
          { path: "contacts", element: page(business, "ContactsPage") },
        ],
      },
      {
        path: "business/projects/:projectId",
        element: page(projectDetail, "ProjectDetailPage"),
      },
      {
        path: "learning",
        element: (
          <SectionLayout
            title="Ta’lim va bilim"
            description="O‘quv resurslari, bilimlar bazasi, ingliz tili va ilmiy ish."
            tabs={[
              { to: "/learning", label: "Resurslar", end: true },
              { to: "/learning/notes", label: "Bilimlar bazasi" },
              { to: "/learning/english", label: "Ingliz tili" },
              { to: "/learning/research", label: "Ilmiy ish" },
            ]}
          />
        ),
        children: [
          { index: true, element: page(learning, "ResourcesPage") },
          { path: "notes", element: page(knowledge, "KnowledgePage") },
          { path: "english", element: page(learning, "EnglishPage") },
          {
            path: "research",
            element: page(() => import("./ResearchPage"), "ResearchPage"),
          },
        ],
      },
      {
        path: "finance",
        element: (
          <SectionLayout
            title="Moliya"
            description="Daromad, xarajat, budjet va jamg‘arma. UZS va USD alohida hisoblanadi."
            tabs={[
              { to: "/finance", label: "Umumiy", end: true },
              { to: "/finance/transactions", label: "Tranzaksiyalar" },
              { to: "/finance/budgets", label: "Budjet" },
              { to: "/finance/savings", label: "Jamg‘arma" },
            ]}
          />
        ),
        children: [
          { index: true, element: page(finance, "FinanceOverviewPage") },
          { path: "transactions", element: page(finance, "TransactionsPage") },
          { path: "budgets", element: page(finance, "BudgetsPage") },
          { path: "savings", element: page(finance, "SavingsPage") },
        ],
      },
      {
        path: "lifestyle",
        element: (
          <SectionLayout
            title="Hayot tarzi"
            description="Odatlar, salomatlik va oila — yengil va moslashuvchan."
            tabs={[
              { to: "/lifestyle", label: "Odatlar", end: true },
              { to: "/lifestyle/health", label: "Salomatlik" },
              { to: "/lifestyle/family", label: "Oila" },
            ]}
          />
        ),
        children: [
          { index: true, element: page(habits, "HabitsPage") },
          { path: "health", element: page(lifestyle, "HealthPage") },
          { path: "family", element: page(lifestyle, "FamilyPage") },
        ],
      },
      {
        path: "analytics",
        element: (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold">
                Statistika va rivojlanish
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Faqat sizning real ma’lumotlaringizdan hisoblangan
                ko‘rsatkichlar.
              </p>
            </div>
            {page(analytics, "AnalyticsPage")}
          </div>
        ),
      },
      { path: "settings", element: page(settings, "SettingsPage") },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
