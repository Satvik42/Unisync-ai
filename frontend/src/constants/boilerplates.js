export const DEFAULT_BOILERPLATES = {
  'Python': `import sys

def solve():
    # Read input from stdin
    # input_data = sys.stdin.read().split()
    
    # Your solution here
    print("Hello from Python IDE!")

if __name__ == "__main__":
    solve()`,

  'JavaScript': `// standard Node.js input handling
const fs = require('fs');

function solve() {
    // const input = fs.readFileSync(0, 'utf8');
    
    // Your solution here
    console.log("Hello from JavaScript IDE!");
}

solve();`,

  'Java': `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        // Your solution here
        System.out.println("Hello from Java IDE!");
    }
}`,

  'C++': `#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Your solution here
    cout << "Hello from C++ IDE!" << endl;

    return 0;
}`
};
