/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";
import * as fc from "d3fc";
import minBandwidth from "./minBandwidth";
import withoutTicks from "./withoutTicks";

const AXIS_TYPES = {
    none: "none",
    ordinal: "ordinal",
    time: "time",
    linear: "linear"
};

export const scale = settings => {
    switch (axisType(settings)) {
        case AXIS_TYPES.none:
            return withoutTicks(defaultScaleBand());
        case AXIS_TYPES.time:
            return d3.scaleTime();
        case AXIS_TYPES.linear:
            return d3.scaleLinear();
        default:
            return defaultScaleBand();
    }
};

const defaultScaleBand = () => minBandwidth(d3.scaleBand());

export const domain = settings => {
    let valueName = "crossValue";

    let extentLinear = fc.extentLinear();
    let extentTime = fc.extentTime();

    const _domain = function(data) {
        const accessData = extent => {
            return extent.accessors([labelFunction(settings)])(data);
        };
        switch (axisType(settings)) {
            case AXIS_TYPES.time:
                return accessData(extentTime);
            case AXIS_TYPES.linear:
                return accessData(extentLinear);
            default:
                return settings.data.map(labelFunction(settings));
        }
    };

    switch (axisType(settings)) {
        case AXIS_TYPES.time:
            fc.rebindAll(_domain, extentTime);
            break;
        case AXIS_TYPES.linear:
            fc.rebindAll(_domain, extentLinear);
            break;
    }

    _domain.valueName = (...args) => {
        if (!args.length) {
            return valueName;
        }
        valueName = args[0];
        return _domain;
    };

    return _domain;
};

export const labelFunction = settings => {
    switch (axisType(settings)) {
        case AXIS_TYPES.none:
            return d => d.__ROW_PATH__[0];
        case AXIS_TYPES.time:
            return d => new Date(d.__ROW_PATH__[0]);
        case AXIS_TYPES.linear:
            return d => d.__ROW_PATH__[0];
        default:
            return d => d.__ROW_PATH__.join("|");
    }
};

export const label = settings => settings.crossValues.map(v => v.name).join(", ");

const axisType = settings => {
    if (settings.crossValues.length === 0) {
        return AXIS_TYPES.none;
    } else if (settings.crossValues.length === 1) {
        if (settings.crossValues[0].type === "datetime") {
            return AXIS_TYPES.time;
        }
    }
    return AXIS_TYPES.ordinal;
};

export const styleAxis = (chart, prefix, settings) => {
    chart[`${prefix}Label`](label(settings));

    const valueSize = v => v.length * 5;
    const valueSetSize = s => s.split && s.split("|").reduce((m, v) => Math.max(m, valueSize(v)), 0);
    const labelSize = prefix === "x" ? 25 : domain(settings)(settings.data).reduce((m, v) => Math.max(m, valueSetSize(v)), 0);

    switch (axisType(settings)) {
        case AXIS_TYPES.ordinal:
            chart[`${prefix}TickGrouping`](t => t.split("|"))
                [`${prefix}TickSizeInner`](settings.crossValues.length > 1 ? labelSize : 5)
                [`${prefix}TickSizeOuter`](0)
                [`${prefix}TickPadding`](8)
                [`${prefix}AxisSize`](settings.crossValues.length * labelSize + 5);
            break;
    }
};
