import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import P5Wrapper from 'react-p5-wrapper';
import p5 from 'p5'

export function sketch (p) {
  p.setup = function () {
    p.createCanvas(600, 400, p.WEBGL);
  };

  p.draw = function () {
    //put yr sketch here
  };
};

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
          </a>
        </header>
        <P5Wrapper sketch={sketch} />
      </div>
    );
  }
}

export default App;
