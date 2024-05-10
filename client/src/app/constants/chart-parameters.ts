import * as agCharts from 'ag-charts-community';

export const TYPE_CATEGORY: agCharts.AgCategoryAxisOptions['type'] = 'category';
export const TYPE_NUMBER: agCharts.AgNumberAxisOptions['type'] = 'number';

export const POSITION_BOTTOM: agCharts.AgBaseCartesianAxisOptions['position'] = 'bottom';
export const POSITION_LEFT: agCharts.AgBaseCartesianAxisOptions['position'] = 'left';

export const TITLE_NUMBER_OF_PLAYERS: agCharts.AgBaseCartesianAxisOptions['title'] = { text: 'Nombre de joueurs' };
export const TITLE_GRADE: agCharts.AgBaseCartesianAxisOptions['title'] = { text: 'Note sur 100' };
export const TITLE_CHOICE: agCharts.AgBaseCartesianAxisOptions['title'] = { text: 'Choix de réponse' };
export const TITLE_NUMBER_OF_SELECTIONS: agCharts.AgBaseCartesianAxisOptions['title'] = { text: 'Nombre de sélections' };
export const TYPE_BAR: agCharts.AgBarSeriesOptions['type'] = 'bar';

export const XKEY_GRADE: agCharts.AgBarSeriesOptionsKeys['xKey'] = 'grade';
export const XKEY_LABEL: agCharts.AgBarSeriesOptionsKeys['xKey'] = 'label';
export const YKEY_COUNT: agCharts.AgBarSeriesOptionsKeys['yKey'] = 'count';
export const YKEY_PICKS: agCharts.AgBarSeriesOptionsKeys['yKey'] = 'picks';

export const XNAME_GRADE: agCharts.AgBarSeriesOptionsNames['xName'] = 'Note sur 100';
export const XNAME_CHOICE: agCharts.AgBarSeriesOptionsNames['xName'] = 'Choix de réponse';
export const YNAME_PLAYERS: agCharts.AgBarSeriesOptionsNames['yName'] = 'Nombre de joueurs';
export const YNAME_CHOICE: agCharts.AgBarSeriesOptionsNames['yName'] = 'Nombre de choix';

export const LONG_ANSWER_HISTOGRAM_AXES: agCharts.AgBaseCartesianChartOptions['axes'] = [
    {
        type: TYPE_CATEGORY,
        position: POSITION_BOTTOM,
    },
    {
        type: TYPE_NUMBER,
        position: POSITION_LEFT,
        title: TITLE_NUMBER_OF_PLAYERS,
    },
];

export const LONG_ANSWER_HISTOGRAM_SERIES: agCharts.AgBaseCartesianChartOptions['series'] = [
    {
        type: TYPE_BAR,
        xKey: XKEY_GRADE,
        yKey: YKEY_COUNT,
        yName: YNAME_PLAYERS,
    },
];

export const LONG_ANSWER_HISTOGRAM_RESULTS_PAGE_AXES: agCharts.AgBaseCartesianChartOptions['axes'] = [
    {
        type: TYPE_CATEGORY,
        position: POSITION_BOTTOM,
        title: TITLE_GRADE,
    },
    {
        type: TYPE_NUMBER,
        position: POSITION_LEFT,
        title: TITLE_NUMBER_OF_PLAYERS,
    },
];

export const HISTOGRAM_AXES: agCharts.AgBaseCartesianChartOptions['axes'] = [
    {
        type: TYPE_CATEGORY,
        position: POSITION_BOTTOM,
        title: TITLE_CHOICE,
    },
    {
        type: TYPE_NUMBER,
        position: POSITION_LEFT,
        title: TITLE_NUMBER_OF_SELECTIONS,
    },
];
