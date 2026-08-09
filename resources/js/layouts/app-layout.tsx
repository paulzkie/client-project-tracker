import type { PropsWithChildren } from 'react';

export default function AppLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border">
                <div className="mx-auto max-w-6xl px-6 py-5">
                    <h1 className="text-xl font-semibold text-foreground">Client Project Tracker</h1>
                    <p className="text-sm text-muted-foreground">
                        Track client projects, monitor progress, and manage priorities.
                    </p>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </div>
    );
}
