import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Papa from 'papaparse'
import * as d3 from 'd3'
import { Table, Button, Modal } from 'react-bootstrap'

class App extends Component {

  constructor() {
    super()
    this.fileSelected = this.fileSelected.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.state = {
      showLinkInfo: false
    }
  }

  nodeExists(node, list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id == node) {
        return true
      }
    }

    return false

  }

  getLink(link, list) {
    for (var i = 0; i < list.length; i++) {
      if ((link.LocalIp == list[i].source && link.RemoteIp == list[i].target) ||
        (link.LocalIp == list[i].target && link.RemoteIp == list[i].source)) {
        return list[i]
      }
    }

    return undefined
  }

  fileSelected(inp) {
    console.log(inp)

    var self = this

    Papa.parse(inp, {
      header: true,
      complete: function (results) {
        console.log(results)

        var links = []
        var nodes = []

        results.data.forEach(element => {
          // add the local and remote nodes if they don't exist
          if (!self.nodeExists(element.LocalIp, nodes)) {
            nodes.push({
              id: element.LocalIp
            })
          }

          if (!self.nodeExists(element.RemoteIp, nodes)) {
            nodes.push({
              id: element.RemoteIp
            })
          }

          // add the link if it does not already exist. If it does exist, append the info 
          var rLink = self.getLink(element, links)
          if (rLink == undefined) {
            rLink = {
              source: element.LocalIp,
              target: element.RemoteIp,
              connections: []
            }

            links.push(rLink)
          }

          rLink.connections.push(element)

        });

        self.drawGraph(nodes, links)

      }
    })
  }

  drawGraph(nodes, links) {

    var self = this
    var w = window.innerWidth,
      h = window.innerHeight,
      radius = 15

    var vis = d3.select("#node-graph")
      .attr("viewBox", "0 0 " + w + " " + h)

    var force = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-8000))
      //.force("center", d3.forceCenter(w / 2, h / 2))
      .force("x", d3.forceX(w / 2).strength(1))
      .force("y", d3.forceY(h / 2).strength(1))
      .force("link", d3.forceLink(links).id(function (d) { return d.id; })
        .distance(50)
        .strength(1))
      .on("tick", tick);

    var linkGroup = vis.append("svg:g")
    var link = linkGroup.selectAll("line.link")
      .data(links)
      .enter().append("svg:line")
      .attr("stroke", "#999")
      .attr("stroke-width", 2)
      .on('click', function (link) {
        console.log(link)
        self.setState({
          selectedLink: link,
          showLinkInfo: true
        })
      });


    var node = vis.selectAll("g.node")
      .data(nodes)
      .enter().append("svg:g")

    node.append("circle")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("r", 5)
      .attr("fill", "blue")

    node.append("svg:text")
      .attr("class", "nodetext")
      .attr("dx", 12)
      .text(function (d) { return d.id });

    function tick() {


      node.attr("transform", function (d) {
        return "translate(" + Math.max(radius, Math.min(w - radius, d.x)) + "," + Math.max(radius, Math.min(h - radius, d.y)) + ")";
      });

      link.attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });
    };


  }

  handleClose() {
    this.setState({
      showLinkInfo: false
    })
  }

  drawModal() {

    if (this.state.showLinkInfo) {
      var tableRows = []

      this.state.selectedLink.connections.forEach(element => {
        tableRows.push(<tr>
          <td>{element.LocalIp}</td>
          <td>{element.LocalPort}</td>
          <td>{element.RemoteIp}</td>
          <td>{element.RemotePort}</td>
        </tr>)
      });

      return (
        <Modal show={this.state.showLinkInfo} onHide={this.handleClose}>

          <Modal.Header closeButton>
            <Modal.Title>Connection Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>

            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Local IP</th>
                  <th>Local Port</th>
                  <th>Remote IP</th>
                  <th>Remote Port</th>
                </tr>
              </thead>
              <tbody>
                {tableRows}
              </tbody>
            </Table>

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

      )
    }

  }

  render() {

    return (
      <div className="App">
        {this.drawModal()}
        <div className="App-header">
          <h2>Zabbix Netstat Visualiser</h2>
        </div>
        <p className="App-intro">
          <input type="file" onChange={e => { this.fileSelected(e.target.files[0]) }} />
        </p>
        <svg id='node-graph'></svg>
      </div>
    );
  }
}

export default App;
