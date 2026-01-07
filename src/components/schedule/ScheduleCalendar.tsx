import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { format, addDays, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

interface ScheduleCalendarProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

export function ScheduleCalendar({ selectedDate, onSelectDate }: ScheduleCalendarProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const today = startOfDay(new Date());

    // Generate 14 days: 3 days back, 10 days forward
    const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 3));

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 200;
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative flex items-center group">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll('left')}
                className="absolute left-0 z-10 hidden md:flex h-full bg-gradient-to-r from-black via-black/80 to-transparent hover:bg-black/50 text-white p-0 w-10"
            >
                <ChevronLeft className="h-6 w-6" />
            </Button>

            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto no-scrollbar px-4 py-4 w-full snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {days.map((date) => {
                    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => onSelectDate(date)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[80px] h-[80px] rounded-xl transition-all duration-300 snap-start border",
                                isSelected
                                    ? "bg-primary text-white border-primary scale-105 shadow-lg shadow-primary/20"
                                    : "bg-zinc-900/50 text-zinc-400 border-white/5 hover:bg-zinc-800 hover:border-white/10 hover:text-white"
                            )}
                        >
                            <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                                {isToday ? "Today" : format(date, 'EEE')}
                            </span>
                            <span className={cn("text-2xl font-bold", isSelected ? "text-white" : "text-zinc-200")}>
                                {format(date, 'd')}
                            </span>
                        </button>
                    );
                })}
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll('right')}
                className="absolute right-0 z-10 hidden md:flex h-full bg-gradient-to-l from-black via-black/80 to-transparent hover:bg-black/50 text-white p-0 w-10"
            >
                <ChevronRight className="h-6 w-6" />
            </Button>
        </div>
    );
}
