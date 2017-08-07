import React from 'react';
import $ from 'jquery';
import Websocket from 'react-websocket';
//import PropTypes from 'prop-types';
//import update from 'immutability-helper';

var Chart = require('react-d3-core').Chart;
var LineChart = require('react-d3-basic').LineChart;


export default class HomePage extends React.Component {
  
  constructor(props){
    super(props);

    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.handleData = this.handleData.bind(this);
    this.update_data = this.update_data.bind(this);
    this.rectify_current = this.rectify_current.bind(this);

    this.state = {
      time: "",
      ws_url: "",
      display_imports: false,
      current_list: [],
      current_data: [],
      historical: []
    }
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
            current_data: this.state.current_data.concat(data),
            historical: this.state.historical.concat([stock_name]),
            [stock_name]: data
          });
        });
      } else if (this.state.current_list.indexOf(stock_name) == -1){
        this.setState({
          current_list: this.state.current_list.concat([stock_name]),
          current_data: this.state.current_data.concat([this.state[stock_name]])
        })
      }
    });
  }


  rectify_current(stock_data){
    this.setState({
      current_list: this.state.current_list.filter(stock => (stock_data.indexOf(stock) != -1)),
      current_data: this.state.current_data.filter(datum => (stock_data.indexOf(datum["Meta Data"]["2. Symbol"]) != -1))
    });
  }

  
  componentDidMount(){

    var request_url = $.ajax({
      type: "POST",
      url: "/get_info",
      contentType: 'application/json'
    });

    request_url.done((data) => {

      this.update_data(data.stock_list);
      this.rectify_current(data.stock_list);

      this.setState({
        ws_url: data.origin.replace(/^http/, 'ws'),
        current_list: data.stock_list,
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
        <p> {this.state.time} </p>
        { 
          this.state.display_imports ?
          <Websocket url={this.state.ws_url} onMessage={this.handleData} /> :
          null
        }
        
     </div>);
  }
}