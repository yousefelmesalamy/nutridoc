(function () {
  function readSeries(elementId) {
    var el = document.getElementById(elementId);
    if (!el) return null;
    return JSON.parse(el.textContent);
  }

  var CHARTS = [
    { canvasId: "chart-posts", dataId: "posts-chart-data" },
    { canvasId: "chart-contacts", dataId: "contacts-chart-data" },
    { canvasId: "chart-plan-requests", dataId: "plan-requests-chart-data" },
  ];

  function sliceDaily(daily, rangeDays) {
    return daily.slice(daily.length - rangeDays);
  }

  function applyRange(state, range) {
    var series = range === "12m" ? state.series.monthly : sliceDaily(state.series.daily, parseInt(range, 10));
    state.chart.data.labels = series.map(function (point) { return point.label; });
    state.chart.data.datasets[0].data = series.map(function (point) { return point.value; });
    state.chart.update();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof Chart === "undefined") return;

    CHARTS.forEach(function (config) {
      var canvas = document.getElementById(config.canvasId);
      var series = readSeries(config.dataId);
      if (!canvas || !series) return;

      var initial = sliceDaily(series.daily, 30);
      var chart = new Chart(canvas, {
        type: "line",
        data: {
          labels: initial.map(function (point) { return point.label; }),
          datasets: [{
            data: initial.map(function (point) { return point.value; }),
            borderColor: "#2e8b57",
            backgroundColor: "rgba(46, 139, 87, 0.1)",
            tension: 0.3,
            fill: true,
            pointRadius: 0,
          }],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });

      var state = { chart: chart, series: series };
      var chipGroup = document.querySelector('.nd-chip-group[data-target="' + config.canvasId + '"]');
      if (!chipGroup) return;

      chipGroup.querySelectorAll(".nd-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          chipGroup.querySelectorAll(".nd-chip").forEach(function (c) { c.classList.remove("active"); });
          chip.classList.add("active");
          applyRange(state, chip.getAttribute("data-range"));
        });
      });
    });
  });
})();
