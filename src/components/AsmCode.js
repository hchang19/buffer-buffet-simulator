import React, {useState} from 'react';
import PropTypes from 'prop-types';
import './AsmCode.css';
const InstrRow = ({currInstr, instrID, command, toggleBreakPt, comment}) => {
  InstrRow.propTypes = {
    currInstr: PropTypes.number,
    instrID: PropTypes.number,
    command: PropTypes.string,
    toggleBreakPt: PropTypes.func,
    comment: PropTypes.string,
  };

  const [isToggeled, togglePt] = useState(false);

  const emit= (e) => {
    togglePt(!isToggeled);
    toggleBreakPt(e);
  };

  console.log('logging currInstr: ' + currInstr);
  console.log('logging instrID: ' + instrID);

  return (
    <div className={currInstr == instrID ? 'debug-asm-instr-inverse' : 'debug-asm-instr'}>
      <div className={isToggeled ? 'debug-asm-breakpts-inactive' : 'debug-asm-breakpts-active'}
        instrID={instrID} onClick={emit}></div>
      <div>{instrID}</div>
      <div>{comment}</div>
      <div></div>
      <div>{command}</div>
    </div>
  );
};

const AsmCode = ({currInstr, instrList, toggleBreakPt}) => {
  AsmCode.propTypes = {
    currInstr: PropTypes.number,
    instrList: PropTypes.arrayOf(PropTypes.object),
    toggleBreakPt: PropTypes.func,
  };

  const instrDisplay =
        instrList.map((instr, i) => {
          return <InstrRow currInstr = {currInstr} key={i} instrID={i}
            toggleBreakPt={toggleBreakPt} command={instr.command}
            comment={instr.comment}/>;
        });

  return (
    <div className="debug-asm-panel">
      <div className="debug-asm-header">
        Assembly
      </div>
      <div className='debug-asm-body'>
        {instrDisplay}
      </div>
    </div>

  );
};

export default AsmCode;
