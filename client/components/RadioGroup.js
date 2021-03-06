import React, { PropTypes } from 'react'

class RadioGroup extends React.PureComponent {

  static propTypes = {
    value: PropTypes.any,
    onChange: PropTypes.func,
  };

  static childContextTypes = {
    onChange: PropTypes.func,
    value: PropTypes.any,
  };

  getChildContext() {
    return {
      onChange: this.change,
      value: this.props.value
    }
  }

  change = value => {
    if ( value !== this.props.value && this.props.onChange ) {
      this.props.onChange(value);
    }
  };

  render() {
    return (
      <div className="custom-controls-stacked mb-1">{this.props.children}</div>
    );
  }

}

export default RadioGroup;
