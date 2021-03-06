import React from 'react'
import { connect } from 'react-redux'
import Checkbox from '../../../../components/Checkbox'
import { togglePlatform } from '../actions'
import { IS_SAFARI } from '../../../../services/globals'

@connect(
  state => ({
    platforms: state.build.natives.allIds,
    natives: state.build.natives.byId,
    selected: state.build.version !== '3.0.0' && !IS_SAFARI ? state.build.platform : {"windows":true,"macos":true,"linux":true},
    disabled: state.build.version === '3.0.0' || IS_SAFARI,
    hide: state.build.mode !== 'zip',
  }),
  {
    togglePlatform
  }
)
class BuildPlatform extends React.Component {

  toggle = (platform) => {
    this.props.togglePlatform(platform);
  };

  render() {
    const props = this.props;

    if ( props.hide ) {
      return null;
    }

    return (
      <div>
        <h4 className="mb-1">Natives</h4>
        <div className="custom-controls-stacked mb-1">
        {
          props.platforms.map(platform => {
            const native = props.natives[platform];

            return (
              <Checkbox
                key={platform}
                label={native.title}
                disabled={props.disabled}
                checked={props.selected[platform]}
                value={platform}
                onChange={this.toggle}
              />
            )
          })
        }
        </div>
      </div>
    )
  }

}

export default BuildPlatform
