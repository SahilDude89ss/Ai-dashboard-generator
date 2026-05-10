import { WidgetType } from "@/types";
import type { ComponentType } from "react";
import type { WidgetProps } from "@/types";

import KpiWidget from "./KpiWidget";
import TimeSeriesWidget from "./TimeSeriesWidget";
import BarWidget from "./BarWidget";
import HorizontalBarWidget from "./HorizontalBarWidget";
import DonutWidget from "./DonutWidget";
import TableWidget from "./TableWidget";

export const WIDGET_REGISTRY: Record<WidgetType, ComponentType<WidgetProps>> = {
  kpi: KpiWidget,
  timeseries: TimeSeriesWidget,
  bar: BarWidget,
  bar_horizontal: HorizontalBarWidget,
  donut: DonutWidget,
  table: TableWidget,
};
