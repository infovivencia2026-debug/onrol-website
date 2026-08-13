import React from "react";
import { Link } from "react-router-dom";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export default class TaskAppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || "Unexpected runtime error in Task Manager.",
    };
  }

  componentDidCatch(error: Error) {
    // Keep this non-blocking; detail can still be inspected in browser console.
    console.error("TaskAppErrorBoundary:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 text-slate-700 dark:bg-[#1a1a1a] dark:text-slate-200">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#404040] dark:bg-[#f3f5f8]">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Task Manager crashed</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            A runtime error occurred while opening the task app.
          </p>
          <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
            {this.state.message}
          </p>
          <div className="mt-4 flex gap-2">
            <Link to="/task" className="rounded-lg bg-[#f3f5f8] px-3 py-2 text-sm font-medium text-white">
              Go to Task Login
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-[#454545] dark:text-slate-200"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
