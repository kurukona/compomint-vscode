// Test Compomint highlighting in JavaScript

const template = `
    <div>
        ##=user.name##
        ##-escapedValue##
        ##%componentName##
        
        ##!
        if (condition) {
            return value;
        }
        ##
        
        ##* This is a comment
        spanning multiple lines
        ##
        
        ##:directive content##
        
        ##
        let x = 5;
        console.log(x);
        ##
    </div>
`;

console.log(template);