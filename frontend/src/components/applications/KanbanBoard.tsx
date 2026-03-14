import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Application, ApplicationStatus } from '@/types';
import { ALL_STATUSES, STATUS_LABELS } from '@/utils/constants';
import { ApplicationCard } from './ApplicationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useUpdateApplication } from '@/hooks/useApplications';
import { toast } from '@/hooks/use-toast';

type ColumnItems = Record<ApplicationStatus, string[]>;

const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

const emptyOrder = Object.fromEntries(ALL_STATUSES.map((s) => [s, []])) as unknown as ColumnItems;

function buildItems(applications: Application[], saved: ColumnItems): ColumnItems {
  const result = {} as ColumnItems;
  for (const status of ALL_STATUSES) {
    const inStatus = applications.filter((a) => a.status === status).map((a) => a.id);
    const ordered = (saved[status] ?? []).filter((id) => inStatus.includes(id));
    const unordered = inStatus.filter((id) => !ordered.includes(id));
    result[status] = [...ordered, ...unordered];
  }
  return result;
}

function loadSaved(): ColumnItems {
  try {
    const raw = localStorage.getItem('kanban-order');
    return raw ? JSON.parse(raw) : emptyOrder;
  } catch {
    return emptyOrder;
  }
}

function SortableCard({ application }: { application: Application }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition: transition ?? undefined }}
      className={isDragging ? 'opacity-40' : ''}
      {...listeners}
      {...attributes}
    >
      <ApplicationCard application={application} />
    </div>
  );
}

function DroppableColumn({
  status,
  ids,
  applications,
  isOver,
}: {
  status: ApplicationStatus;
  ids: string[];
  applications: Application[];
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="w-60 flex-shrink-0 flex flex-col h-full">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {ids.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto pr-1 rounded-md transition-colors ${
          isOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''
        }`}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {ids.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
              Empty
            </div>
          ) : (
            <div className="space-y-2">
              {ids.map((id) => {
                const app = applications.find((a) => a.id === id);
                return app ? <SortableCard key={id} application={app} /> : null;
              })}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  applications: Application[];
  isLoading: boolean;
}

export function KanbanBoard({ applications, isLoading }: KanbanBoardProps) {
  const [items, setItems] = useState<ColumnItems>(() => buildItems([], loadSaved()));
  const [dragStartItems, setDragStartItems] = useState<ColumnItems | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<ApplicationStatus | null>(null);
  const updateApplication = useUpdateApplication();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    setItems((prev) => buildItems(applications, prev));
  }, [applications]);

  const findColumn = (id: string): ApplicationStatus | null => {
    if (ALL_STATUSES.includes(id as ApplicationStatus)) return id as ApplicationStatus;
    return ALL_STATUSES.find((s) => items[s].includes(id)) ?? null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setDragStartItems(items);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeCol = findColumn(activeId);
    const overCol = findColumn(overId);

    if (!activeCol || !overCol) return;
    setOverColumn(overCol);
    if (activeCol === overCol) return;

    setItems((prev) => {
      const activeItems = [...prev[activeCol]];
      const overItems = [...prev[overCol]];
      activeItems.splice(activeItems.indexOf(activeId), 1);
      let overIndex = overItems.indexOf(overId);
      if (overIndex === -1) overIndex = overItems.length;
      overItems.splice(overIndex, 0, activeId);
      return { ...prev, [activeCol]: activeItems, [overCol]: overItems };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumn(null);

    if (!over) {
      if (dragStartItems) setItems(dragStartItems);
      setDragStartItems(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeCol = findColumn(activeId);
    const overCol = findColumn(overId);

    let finalItems = items;

    if (activeCol && overCol && activeCol === overCol) {
      const col = items[activeCol];
      const from = col.indexOf(activeId);
      const to = col.indexOf(overId);
      if (from !== to && to !== -1) {
        finalItems = { ...items, [activeCol]: arrayMove(col, from, to) };
        setItems(finalItems);
      }
    }

    localStorage.setItem('kanban-order', JSON.stringify(finalItems));

    const originalCol = dragStartItems
      ? ALL_STATUSES.find((s) => dragStartItems[s].includes(activeId))
      : null;

    if (originalCol && overCol && originalCol !== overCol) {
      try {
        await updateApplication.mutateAsync({ id: activeId, data: { status: overCol } });
      } catch {
        if (dragStartItems) setItems(dragStartItems);
        toast({ variant: 'destructive', title: 'Failed to update status' });
      }
    }

    setDragStartItems(null);
  };

  const handleDragCancel = () => {
    if (dragStartItems) setItems(dragStartItems);
    setActiveId(null);
    setOverColumn(null);
    setDragStartItems(null);
  };

  const activeApp = activeId ? applications.find((a) => a.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 h-[calc(100vh-200px)]">
        {ALL_STATUSES.map((s) => (
          <div key={s} className="w-60 flex-shrink-0 space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-2 px-1 h-[calc(100vh-200px)]">
        {ALL_STATUSES.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            ids={items[status]}
            applications={applications}
            isOver={overColumn === status}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeApp && (
          <div className="rotate-2 opacity-95 shadow-xl">
            <ApplicationCard application={activeApp} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
