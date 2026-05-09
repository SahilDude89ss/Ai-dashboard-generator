import { WidgetSpec } from "@/types";

export interface GridItem {
  id: string;
  gridSpan: 1 | 2 | 3 | 4;
  colStart: number;
  row: number;
}

export function calculateGridLayout(widgets: WidgetSpec[]): GridItem[] {
  const items: GridItem[] = [];
  let currentCol = 1;
  let currentRow = 1;

  for (const widget of widgets) {
    const span = widget.gridSpan ?? 1;

    if (currentCol + span - 1 > 4) {
      currentCol = 1;
      currentRow++;
    }

    items.push({
      id: widget.id,
      gridSpan: span,
      colStart: currentCol,
      row: currentRow,
    });

    currentCol += span;
    if (currentCol > 4) {
      currentCol = 1;
      currentRow++;
    }
  }

  return items;
}
