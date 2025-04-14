d3.json("bubble_diagonal.json").then(data => {
  const svg = d3.select("svg")
      .attr("width", 1400);

  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const filteredData = data.filter(d => d.mean_SD > 0);

  const meanExtent = d3.extent(filteredData, d => d.mean_SD);
  const yExtent = d3.extent(filteredData, d => d.y_layer);

  const xScale = d3.scaleLinear()
      .domain([0, 18])
      .range([80, width - 80]);

  const yBaseScale = d3.scaleLinear()
      .domain(meanExtent)
      .range([0, 60]); // висота патерну всередині року

  const layerOffset = d3.scaleLinear()
      .domain(yExtent)
      .range([height - 50, 70]);

  const rScale = d3.scaleSqrt()
      .domain([0, d3.max(filteredData, d => d.mean_SD)])
      .range([2, 22]);

  const regionMap = {
    'SWEDEN': 'Northern Europe', 'NORWAY': 'Northern Europe', 'ESTONIA': 'Northern Europe', 'LATVIA': 'Northern Europe',
    'FRANCE': 'Western Europe', 'GERMANY': 'Western Europe', 'NETHERLANDS': 'Western Europe', 'UNITED KINGDOM': 'Western Europe', 'LUXEMBOURG': 'Western Europe', 'SWITZERLAND': 'Western Europe',
    'AUSTRIA': 'Central Europe', 'SLOVENIA': 'Central Europe', 'SLOVAKIA': 'Central Europe',
    'POLAND': 'Eastern Europe', 'CROATIA': 'Eastern Europe',
    'GREECE': 'Southern Europe'
  };

  const nested = d3.groups(filteredData, d => d.Year, d => d.Month_Num);

  let flattened = [];
  nested.forEach(([year, months]) => {
    months.forEach(([month, values]) => {
      values.forEach((d) => {
        const groupStart = Math.floor(d.y_layer / 6) * 6;
        const offsetInGroup = d.y_layer - groupStart;
        const yearShift = offsetInGroup * 2.5;

        d.x_offset = +d.Month_Num / 5 + yearShift;
        d.y_pos = layerOffset(d.y_layer) - yBaseScale(d.mean_SD)*1.5;
        flattened.push(d);
      });
    });
  });

  svg.selectAll("circle")
      .data(flattened)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.x_offset))
      .attr("cy", d => d.y_pos)
      .attr("r", d => rScale(d.mean_SD/4))
      .attr("class", d => `country-${(d.country || '').trim().replace(/\\s+/g, '').toUpperCase()}`)
      .append("title")
      .text(d => `${d.country} (${d.Year})\nMonth: ${d.Month_Num}\nMean SD: ${d.mean_SD.toFixed(2)}`);

  const yearLabels = svg.append("g");
  const uniqueYears = Array.from(new Set(flattened.map(d => d.Year)));

  uniqueYears.forEach(year => {
    let d = flattened.find(e => e.Year === year);
    if (year === 2020) {
      d = flattened.find(e => e.Year === year && e.Month_Num === 1); // або додати логіку для точнішого зміщення
    }
    if (d) {
      const x = xScale(0 + d.x_offset);
      const y = layerOffset(d.y_layer) + 30;

      yearLabels.append("text")
          .attr("x", x)
          .attr("y", y)
          .text(year)
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("fill", "#333")
          .attr("text-anchor", "start");
    }
  });

  const countries = Array.from(new Set(flattened.map(d => d.country)));
  const regions = ['Northern Europe', 'Western Europe', 'Central Europe', 'Eastern Europe', 'Southern Europe'];

  const legend = svg.append("g")
      .attr("transform", `translate(${width - 240}, 40)`);

  let yPos = 0;

  regions.forEach(region => {
    legend.append("text")
        .text(region)
        .attr("x", 0)
        .attr("y", yPos)
        .style("font-size", "13px")
        .style("font-weight", "bold")
        .style("fill", "#333");

    yPos += 20;

    countries.filter(c => regionMap[c.toUpperCase()] === region).forEach(country => {
      const className = `country-${country.replace(/\s+/g, '').toUpperCase()}`;

      legend.append("circle")
          .attr("cx", 0)
          .attr("cy", yPos)
          .attr("r", 6)
          .attr("class", className);

      legend.append("text")
          .attr("x", 14)
          .attr("y", yPos + 2)
          .text(country)
          .style("font-size", "12px")
          .style("alignment-baseline", "middle");

      yPos += 20;
    });

    yPos += 10;
  });
});