import { CreateCircleAction, CreateRectangleAction, TranslateAction } from './actions'
import { SimpleDrawDocument } from './document'

export class Interpreter{
	validTokens: any = {
		'id': /^[A-Za-z\$][\d[A-Za-z\$]*$/,
		'numeral': /^\d+(\.\d+)?$/,
		'circle': /^circle$/i,
		'rectangle': /^rectangle$/i,
		'translate': /^translate$/i,
		'rotate': /^rotate$/i,
	};

	ignoredChars: Array<string> = [
		' ',
	]

	constructor(public sdd: SimpleDrawDocument){}

	execute(input: string): string{
		try{
			let tokens = this.tokenize(input)
			let expressions = this.parse(tokens)
			if(input !== ""){
				let command = this.build(expressions);
				let ctx = new Context(this.sdd);
				return command.interpret(ctx);
			}
			 
			return "";
		}
		catch(e){
			return e;
		}
	}	

	tokenize(input: string): Array<string> {
		let tokens = new Array<string>();
		for(let i = 0; i < input.length; i++){
			if(this.ignoredChars.indexOf(input[i]) !== -1)
				continue

			let matched = false;
			for(let j = input.length-i; j > 0 && !matched; j--){
				let substr = input.substring(i,i+j)
				for(let key in this.validTokens){
					if(substr.match(this.validTokens[key])){
						matched = true
						tokens.push(substr)
						i += j-1
						break
					}
				}
			}

			if(!matched){
				throw "Unrecognized character sequence starting at index "+i+".";
			}
		}
		return tokens;
	}

	parse(tokens: Array<string>): Array<Expression>{
		let expressions = new Array<Expression>();
		let expr: Expression
		let argsNr: number
		for(let i = 0; i < tokens.length; i++){
			expr = ExpressionFactory.getExpression(tokens[i].toLowerCase())
			argsNr = expr.getArgsNr()
			if(argsNr > 0){
				expr.bindArgs(tokens.slice(i+1,i+1+argsNr))
				i += argsNr
			}
			expressions.push(expr);
		}

		return expressions;
	}

	build(expressions: Array<Expression>): Expression { 
		if(expressions.length > 0){
			return expressions[0]
		}
		else{
			throw "Unrecognized command"
		}
	}
}

class ExpressionFactory{

	static getExpression(token: string): Expression{
		switch(token){
			case 'circle':
				return new CircleExpression();
				break;

			case 'rectangle':
				return new RectangleExpression();
				break;
			
			default:
				throw "Unknown expression at \""+token+"\".";
		}
	}
}

class Context {
	action: string
	args: Array<string>

	constructor(public sdd: SimpleDrawDocument){}

	execute(): string{
		switch(this.action){
			case 'CIRCLE':
				this.sdd.createCircle(parseFloat(this.args[0]),parseFloat(this.args[1]),parseFloat(this.args[2]))
				break;

			case 'RECTANGLE':
				this.sdd.createRectangle(parseFloat(this.args[0]),parseFloat(this.args[1]),parseFloat(this.args[2]),parseFloat(this.args[3]))
				break;

			// case 'TRANSLATE':
			// 	this.sdd.translate(this.args[0], parseFloat(this.args[1]), parseFloat(this.args[2]));
			// 	break;
		}
		return "OK"
	}
}

interface Expression {
	interpret(context : Context) : string
	getArgsNr(): number
	bindArgs(args: Array<string>): void
}

class CircleExpression implements Expression {
	args: Array<string>

	interpret(context: Context): string {
		context.action = "CIRCLE";
		context.args = this.args;
		return context.execute();
	}

	bindArgs(args: Array<string>): void {
		if(args.length != 3)
			throw "Error, expected 3 arguments";
			
		for(let arg of args){
			if(arg == undefined)
				throw "Error, expected numeric argument"
			if(isNaN(parseFloat(arg))){
				throw "Sytanx error at \""+arg+"\", expect numeric argument"
			}
		}
		
		this.args = args;
	}

	getArgsNr(): number{
		return 3;
	}
}

class RectangleExpression implements Expression {
	args: Array<string>

	interpret(context: Context): string {
		context.action = "RECTANGLE";
		context.args = this.args;
		return context.execute();
	}

	bindArgs(args: Array<string>): void{
		if(args.length != 4)
			throw "Error, expected 4 arguments";

		for(let arg in args){
			if(arg == undefined)
				throw "Error, expected numeric argument"
			if(parseFloat(arg) === NaN )
				throw "Sytanx error at \""+arg+"\", expect numeric argument"
		}
		
		this.args = args;
	}

	getArgsNr(): number{
		return 4;
	}
}

/*
	BASIC GRAMMAR

	Circle x y rad
	Rectangle x y w h
	Translate fig_id dx dy
	Rotate fig_id ang
*/

