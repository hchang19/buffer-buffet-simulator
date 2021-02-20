//14 Registers
const registerList = [
    '%ebp', '%esp', '%eip',
    '%eax',
    '%edi', '%esi', '%edx', '%ecx', '%r8D', '%r9D',
    '%r10D', '%r11D', '%r12D', '%r13D'
]

export const registerMap = registerList.reduce((map, name, i) => {
    map[name] = i * 4
    return map
}, {})

//for internal use only
export const getRegisterID = (name) => {
    if(!(name in registerMap)){
        throw new Error(`getRegisterID: No such register ${name}`)
    }

    return registerMap[name]
}

//get the value inside a register
export const getRegister = (name, memoryDV) =>
{   
    return memoryDV.getUint32(getRegisterID(name))
}

export const setRegister = (name, value, memoryDV) => {
    //type check the value input
    if(typeof value === 'number'){
        if (Math.round(value) === value ){
            if(value <0){
                memoryDV.setInt32(getRegisterID(name), value)
            }
            memoryDV.setUint32(getRegisterID(name), value)
        }
        else{
            memoryDV.setFloat32(getRegisterID(name), value)
        }
    }
    else{
        throw new Error(`setRegister: Only input int and floats`)
    }
}

const check2Param = (argList) => argList[2].length !== 0;

// const checkArgType = (param) => {
//     const registerList = ["%eax", "%ebx", "%rsp", "%r1", "%r2", "%r3", "%r4", "%r5", "%r6", "%r7", "%r8"];

//     // is register
//     if (registerList.includes(param))
//         return "register";
//     // is hex #
//     else if (/^\$0x/.test(param))
//         return "hex";
//     else if (/^\$/.test(param))
//         return "decimal";
//     else if (param === 0)
//         return "zero";
//     else
//         return "unknown param";   
// }

const parseNoParentheses = (argString) => {
    let arg = [];
    arg[0] = "";
    for (let i = 0; i < argString.length && argString[i] !== ','; i++) {
        arg[0] += argString[i];
    }
    return arg;
}

const parseParentheses = (argString) => {
    let arg = [];
    arg.push(argString.match(/(.*)(?=\()/)[0]);                                                           // add this arg
    if (!arg[0] || arg[0] === "")
        arg[0] = ('0');
    argString = argString.replace(/(.*)(?=\()/,"");

    arg[1]="";
    let i = argString.search(/\(/)+1;
    for (; i < argString.length && argString[i].match(/([^, | )])/); i++) {                               // first arg in parentheses
        arg[1] += argString[i];
    }
    if (argString[i] === ')') {
        return arg;
    }
    else {
        arg[2]="";
        for (i+=1; i < argString.length && argString[i].match(/([^,|)])/); i++) {                         // second arg in parentheses
            if ((argString[i]) !== ' ')
                arg[2] += argString[i]; 
        }
        if (argString[i] === ')') {
            return arg;
        }
        else {
            arg[3]="";
            for (i+=1; i < argString.length && argString[i].match(/([^,|)])/); i++) {                     // third arg in parentheses (multiply)
                if ((argString[i]) !== ' ')
                    arg[3] += argString[i]; 
            }
        }
    }
    return arg;
}

const paramToDeci = (param, memoryDV) => {
    for (let i = 0; i < param.length; i++) {
        // is register
        if (registerList.includes(param[i]))
            param[i] = getRegister(param[i], memoryDV)
        // is hex #
        else if (/^\$0x/.test(param[i])) {
            const hexNum = param[i].match(/(?<=\$).*/)[0]
            param[i] = parseInt(hexNum, 16);
        }
        // is decimal #
        else if (/^\$/.test(param[i])) {
            const deciNum = param[i].match(/(?<=\$).*/)[0]
            param[i] = parseInt(deciNum)
        }
        // else if (param[i] === 0)
        //     ;
        else
            return "unknown param";
    }
    return param
}

// takes in parsed param array 
// does math from given param array
const interpretParam = (param) => {
    let resString = ""
    let resSum
    switch (param.length) {
        // no parentheses
        case 1 :
            return param[0]

        // parentheses case
        case 4 :
            resString += "*" + param[3]
            resString = " + " + param[2] + resString
            resString = param[1] + resString
            if (param[0] !== "0")
                resString = param[0] + " + " + resString

            resSum = param[0] + param[1] + (param[2]*param[3])
            break;
        case 3:     
            resString = " + " + param[2] + resString
            resString = param[1] + resString
            if (param[0] !== "0")
                resString = param[0] + " + " + resString

            resSum = param[0] + param[1] + param[2]
            break;
        case 2:
            resString = param[1] + resString
            if (param[0] !== "0")
                resString = param[0] + " + " + resString
            
            resSum = param[0] + param[1]
            break;
        default : 
            return "error"
    }
    resString = "contents of (" + resString + ")"
    console.log(resString)
    
    return resSum
} 

export const interpretCommand = (event, memoryDV) => {
    event.preventDefault()
    let argList = parseCode()

    // argList[0] = command e.g "mov"
    // argList[1] = 1st Parameter, with separate arguments in order from left to right
    // argList[2] = 2nd Parameter, same as above
    switch(argList[0]) {
        // mov Source, Dest
        case "mov" :
            if (!check2Param(argList)) {
                console.log("Needs two parameters")
                return
            }

            // move into register
            if (argList[2].length === 1 && registerList.includes(argList[2][0]))
                setRegister(argList[2][0], interpretParam(paramToDeci(argList[1], memoryDV)), memoryDV)

            //TODO move into address

            break;
            
        // leaq Source, Dest
        case "leaq":
            if (!check2Param(argList)) {
                console.log("Needs two parameters")
                return
            }
            console.log("load " + interpretParam(argList[1]) + " into " + interpretParam(argList[2]))
            break
        
        // compares S1 - S2
        // sets compare flag for jumps
        // cmp S2, S1
        case "cmp" :
            if (!check2Param(argList)) {
                console.log("Needs two parameters")
                return
            }
            console.log("compare " + interpretParam(argList[1]) + " with " + interpretParam(argList[2]))
            break

        // add source to dest
        // add Source, Dest
        case "add" :
            if (!check2Param(argList)) {
                console.log("Needs two parameters")
                return
            }
            // Dest is register
            if (argList[2].length === 1 && registerList.includes(argList[2][0])) {
                let sum = parseInt(getRegister(argList[2][0], memoryDV), 10) + parseInt(interpretParam(paramToDeci(argList[1], memoryDV)), 10)
                memoryDV.setUint32(getRegisterID(argList[2][0]), sum)
            }
            console.log("add " + interpretParam(argList[1]) + " to " + interpretParam(argList[2]))
            break

        // subtrac source from dest
        // sub Source, Dest
        case "sub" :
            if (!check2Param(argList)) {
                console.log("Needs two parameters")
                return
            }
            // Dest is register
            if (argList[2].length === 1 && registerList.includes(argList[2][0])) {
                let diff = parseInt(getRegister(argList[2][0], memoryDV), 10) - parseInt(interpretParam(paramToDeci(argList[1], memoryDV)), 10)
                memoryDV.setUint32(getRegisterID(argList[2][0]), diff)
            }
            console.log("subtract " + interpretParam(argList[1]) + " from " + interpretParam(argList[2]))
            break;
        
        // jump to dest
        // jmp Dest
        // TODO - implement conditional jmp commands (jle)
        case "jmp" :
            if (check2Param(argList)) {
                console.log("Needs only one parameter")
                return
            }
            console.log("jump to " + interpretParam(argList[1]))
            break

        // pop top of stack into destination
        // pop Dest
        case "pop" :
            if (check2Param(argList)) {
                console.log("Needs only one parameter")
                return
            }
            console.log("pop top of stack to " + interpretParam(argList[1]))
            break;

        // push source onto top of stack
        // push Source
        case "push" :
            if (check2Param(argList)) {
                console.log("Needs only one parameter")
                return
            }
            console.log("push " + interpretParam(argList[1]) + " to top of stack")
            break;
        default :
            console.log("Unsupported command")
            break
    }
    console.log(getRegister('%eax', memoryDV))
}

// currently takes command from an input element and parses it
export const parseCode = (event) => {
    let codeString = document.getElementById("codeInput").value;
    
    let command = "";
    let arg1 = [];
    let arg2 = [];
    let arg1String, arg2String;
    let charNum = 0;
    for (; charNum < codeString.length && codeString[charNum] !== ' '; charNum++) {
        command += codeString[charNum];
    }
    let isTwoArgs = true;
    codeString = codeString.substring(charNum+1);

    // 1st arg has parentheses
    if (codeString.match(/(?<!,.*)(\S*\(.*?\))(?=,|$)/)) {
        // 2 Params
        if (codeString.match(/(\S*\(.*?\))(?=,)/))
            arg1String = codeString.match(/(\S*\(.*?\))(?=,)/)[0];          

        // 1 Param
        else {
            arg1String = codeString.match(/(\S*\(.*?\))(?=$)/)[0];                                      
            isTwoArgs = false 
        }
        arg1 = parseParentheses(arg1String);
    }
    // 1st arg has no parentheses
    else {
        // 2 Params
        if (codeString.match(/(.*?)(?=,)/))
            arg1String = codeString.match(/(.*?)(?=,)/)[0];     
        
        // 1 Param
        else {
            isTwoArgs = false;
            arg1String = codeString.match(/(.*?)(?=$)/)[0];                                           
        }
        arg1 = parseNoParentheses(arg1String);                                                              
    }

    codeString = codeString.substring(arg1String.length);
    // parse 2nd argument
    if (isTwoArgs) {                                                                                                    
        if (codeString.match(/(?<=, )(.*)/))
            arg2String = codeString.match(/(?<=, )(.*)/)[0];
        else if (codeString.match(/(?<=,)(.*)/))
            arg2String = codeString.match(/(?<=,)(.*)/)[0];
        else {
            console.log('Something went wrong');
            return;
        }
        // 2nd Param has parentheses
        if (arg2String.match(/(.*)\((.*)\)/))                                                                           
            arg2 = parseParentheses(arg2String);
        // 2nd Param doesn't have parentheses
        else
            arg2 = parseNoParentheses(arg2String);
    }
    console.log([command, arg1, arg2])
    return([command, arg1, arg2]);
}
