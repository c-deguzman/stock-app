import React from 'react';
import $ from 'jquery';
import Websocket from 'react-websocket';
import d3 from 'd3';
import { LineChart } from 'react-d3-basic'


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

    this.state = {
      time: "",
      ws_url: "",
      display_imports: false,
      current_list: [],
      current_data: [],
      historical: [],
      require_update: true
    }
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

  collect_chart_data(){
    var curr_time = new Date();
    var chart_data = [];

    for (var i = 0; i <= 365; i++){
      var date_str = this.add_date(curr_time.getFullYear() - 1, curr_time.getMonth(), curr_time.getDate(), i);

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

    return chart_data;
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

    this.setState({
      chart_data: this.collect_chart_data()
    }, () => console.log("Finished all async calls. State has been updated."));
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
        { 
          this.state.display_imports ?
          <Websocket url={this.state.ws_url} onMessage={this.handleData} /> :
          null
        }
        
     </div>);
  }
}