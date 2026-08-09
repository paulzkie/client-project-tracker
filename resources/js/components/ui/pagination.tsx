import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from './button';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links: PaginationLink[];
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
    onNavigate: (url: string) => void;
}

function decodeLabel(label: string): string {
    return label.replace(/&laquo;|&raquo;/g, '').trim();
}

export function Pagination({ links, currentPage, lastPage, total, perPage, onNavigate }: PaginationProps) {
    if (lastPage <= 1 || links.length < 2) return null;

    const prev = links[0];
    const next = links[links.length - 1];
    const pageLinks = links.slice(1, -1);

    const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const to = Math.min(currentPage * perPage, total);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{from}</span>
                {'–'}
                <span className="font-medium text-foreground">{to}</span> of{' '}
                <span className="font-medium text-foreground">{total}</span> projects
            </p>

            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    disabled={!prev.url}
                    onClick={() => prev.url && onNavigate(prev.url)}
                    aria-label="Previous page"
                >
                    <ChevronLeftIcon className="size-4" />
                </Button>

                {pageLinks.map((link, index) =>
                    decodeLabel(link.label) === '...' ? (
                        <span key={index} className="px-2 text-sm text-muted-foreground">
                            …
                        </span>
                    ) : (
                        <Button
                            key={index}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            className="min-w-9"
                            disabled={!link.url}
                            aria-current={link.active ? 'page' : undefined}
                            onClick={() => link.url && onNavigate(link.url)}
                        >
                            {decodeLabel(link.label)}
                        </Button>
                    ),
                )}

                <Button
                    variant="outline"
                    size="icon"
                    disabled={!next.url}
                    onClick={() => next.url && onNavigate(next.url)}
                    aria-label="Next page"
                >
                    <ChevronRightIcon className="size-4" />
                </Button>
            </div>
        </div>
    );
}
