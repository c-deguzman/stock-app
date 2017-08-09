import React from 'react';
import $ from 'jquery';
import Websocket from 'react-websocket';
//import d3 from 'd3';
import { Chart } from 'react-d3-core';
import { LineChart } from 'react-d3-basic';
import { LineTooltip, SimpleTooltip } from 'react-d3-tooltip';


export default class HomePage extends React.Component {
  
  constructor(props){
    super(props);

    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.handleData = this.handleData.bind(this);
    this.update_data = this.update_data.bind(this);
    this.rectify_current = this.rectify_current.bind(this);
    this.select_ticker = this.select_ticker.bind(this);

    this.add_date = this.add_date.bind(this);
    this.pad_two = this.pad_two.bind(this);
    this.collect_chart_data = this.collect_chart_data.bind(this);
    this.finished_async_calls = this.finished_async_calls.bind(this);

    this.xAccessor = this.xAccessor.bind(this);

    this.state = {
      time: "",
      ws_url: "",
      display_imports: false,
      current_list: [],
      current_data: [],
      historical: [],
      chart_data: [],
      chart_series: [],
      require_update: true
    }
  }

  xAccessor(datum){
    //var parseTime = d3.timeParse("%Y-%m-%d");
    var parseTime = d3.time.format("%Y-%m-%d").parse;

    return parseTime(datum.time);
  }

  select_ticker(datum){
    return datum["Meta Data"]["2. Symbol"];
  }

  pad_two(num){
    if (num < 10){
      return "0" + num;
    } else {
      return "" + num;
    }
  }


  add_date(year, month, day, days_added){
    var date = new Date();

    date.setYear(year);
    date.setMonth(month);
    date.setDate(day + days_added);

    return "" + date.getFullYear() + "-" + this.pad_two(date.getMonth() + 1) + "-" + this.pad_two(date.getDate());
  }

  collect_chart_data(days){
    var curr_time = new Date();
    var chart_data = [];

    for (var i = 0; i <= days; i++){
      var date_str = this.add_date(curr_time.getFullYear(), curr_time.getMonth(), curr_time.getDate(), i * -1);

      var local_obj = {time: date_str};

      var one_stock = false;

      for (var j in this.state.current_data){

        var result_val = 0;

        if (this.state.current_data[j]["Time Series (Daily)"].hasOwnProperty(date_str)){
          result_val = this.state.current_data[j]["Time Series (Daily)"][date_str]["4. close"];
          one_stock = true;
        }

        local_obj[this.select_ticker(this.state.current_data[j])] = result_val;
      }

      if (one_stock == true){
        chart_data.push(local_obj);
      }
    }

    var chart_series = [];

    for (var k in this.state.current_list){
      var local_obj_ii = {};

      local_obj_ii["field"] = this.state.current_list[k];
      local_obj_ii["name"] = this.state.current_list[k];

      chart_series.push(local_obj_ii);
    }

    this.setState({
      chart_data: chart_data,
      chart_series: chart_series
    })
  }

  finished_async_calls(stock_data){

    if (stock_data.length != this.state.current_list.length){
      return;
    }

    for (var i in stock_data){
      if (this.state.current_list.indexOf(stock_data[i].ticker) == -1){
        return;
      }
    }

    this.collect_chart_data(365);
    console.log("Finished all async calls. State has been updated.");
  }


  update_data(stock_data){

    $.each(stock_data, (ind, item) => {

      var stock_name = item.ticker;

      if (this.state.historical.indexOf(stock_name) == -1){
        $.ajax({
          type: "POST",
          url: "/get_stock",
          contentType: 'application/json',
          data: JSON.stringify({ticker: stock_name})
        }).done((data) => {
          this.setState({
            current_list: this.state.current_list.concat([stock_name]),
            current_data: this.state.current_data.concat([JSON.parse(data)]),
            historical: this.state.historical.concat([stock_name]),
            [stock_name]: JSON.parse(data)
          }, () => this.finished_async_calls(stock_data));
        });
      } else if (this.state.current_list.indexOf(stock_name) == -1){
        this.setState({
          current_list: this.state.current_list.concat([stock_name]),
          current_data: this.state.current_data.concat([this.state[stock_name]])
        }, () => this.finished_async_calls(stock_data));
      }
    });
  }


  rectify_current(stock_data){
    this.setState({
      current_list: this.state.current_list.filter(stock => (stock_data.indexOf(stock) != -1)),
      current_data: this.state.current_data.filter(datum => (stock_data.indexOf(datum["Meta Data"]["2. Symbol"]) != -1))
    }, () => this.finished_async_calls(stock_data));
  }

  
  componentDidMount(){

    $.ajax({
      type: "POST",
      url: "/get_info",
      contentType: 'application/json'
    }).done((data) => {

      this.update_data(data.stock_list);
      this.rectify_current(data.stock_list);

      this.setState({
        ws_url: data.origin.replace(/^http/, 'ws'),
        display_imports: true
      });
    });
  }

  
  handleData(data){
    var result = JSON.parse(data);
    this.setState({time: result.time});
  }


  render() {

    return (
      <div>
        <h1> Stock App Delta </h1>
        <button className="btn btn-default" 
                onClick={() => console.log(this.state)}> State Log </button>
        <p> {this.state.time} </p>

        <div className="btn-group">
            <button className="btn btn-default" onClick={() => this.collect_chart_data(7)}>1 week</button>
            <button className="btn btn-default" onClick={() => this.collect_chart_data(31)}>1 Month</button>
            <button className="btn btn-default" onClick={() => this.collect_chart_data(180)}>6 Months</button>
            <button className="btn btn-default" onClick={() => this.collect_chart_data(365)}>1 Year</button>
            <button className="btn btn-default" onClick={() => this.collect_chart_data(365 * 5)}>5 Years</button>
          </div>


        { 
          this.state.display_imports ?
          <div>
          <Websocket url={this.state.ws_url} onMessage={this.handleData} /> 

          
          <div className="centre">
            <div id="chart_wrapper">
            <LineTooltip
              title="Stock History"
              data={this.state.chart_data}
              width={1000}
              height={500}
              margins={{left: 100, right: 50, top: 50, bottom: 50}}
              chartSeries={this.state.chart_series}
              x={this.xAccessor}
              xScale="time" 
              xLabel="Date"
              yLabel="Stock Price (USD)"

            >
              <SimpleTooltip />
            </LineTooltip>
            </div>
          </div>
          

          </div>:
          null
        }
        
     </div>);
  }
}