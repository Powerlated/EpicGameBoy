let DMG_OPS = {
  "Unprefixed": [
    {
      "Name": "NOP",
      "Group": "control/misc",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD BC,u16",
      "Group": "x16/lsm",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower->C"
        },
        {
          "Type": "read",
          "Comment": "u16:upper->B"
        }
      ]
    },
    {
      "Name": "LD (BC),A",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "A->(BC)"
        }
      ]
    },
    {
      "Name": "INC BC",
      "Group": "x16/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "Probably writes to C here"
        },
        {
          "Type": "internal",
          "Comment": "Probably writes to B here"
        }
      ]
    },
    {
      "Name": "INC B",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "DEC B",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD B,u8",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8->B"
        }
      ]
    },
    {
      "Name": "RLCA",
      "Group": "x8/rsb",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "0",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD (u16),SP",
      "Group": "x16/lsm",
      "TCyclesBranch": 20,
      "TCyclesNoBranch": 20,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        },
        {
          "Type": "write",
          "Comment": "SP:lower->(u16)"
        },
        {
          "Type": "write",
          "Comment": "SP:upper->(u16+1)"
        }
      ]
    },
    {
      "Name": "ADD HL,BC",
      "Group": "x16/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "Probably writes to L here"
        },
        {
          "Type": "internal",
          "Comment": "Probably writes to H here"
        }
      ]
    },
    {
      "Name": "LD A,(BC)",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(BC)->A"
        }
      ]
    },
    {
      "Name": "DEC BC",
      "Group": "x16/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "Probably writes to C here"
        },
        {
          "Type": "internal",
          "Comment": "Probably writes to B here"
        }
      ]
    },
    {
      "Name": "INC C",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "DEC C",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD C,u8",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8->C"
        }
      ]
    },
    {
      "Name": "RRCA",
      "Group": "x8/rsb",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "0",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "STOP",
      "Group": "control/misc",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD DE,u16",
      "Group": "x16/lsm",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower->E"
        },
        {
          "Type": "read",
          "Comment": "u16:upper->D"
        }
      ]
    },
    {
      "Name": "LD (DE),A",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "A->(DE)"
        }
      ]
    },
    {
      "Name": "INC DE",
      "Group": "x16/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "Probably writes to E here"
        },
        {
          "Type": "internal",
          "Comment": "Probably writes to D here"
        }
      ]
    },
    {
      "Name": "INC D",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "DEC D",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD D,u8",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8->D"
        }
      ]
    },
    {
      "Name": "RLA",
      "Group": "x8/rsb",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "0",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "JR i8",
      "Group": "control/br",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "i8"
        },
        {
          "Type": "internal",
          "Comment": "modify PC"
        }
      ]
    },
    {
      "Name": "ADD HL,DE",
      "Group": "x16/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "Probably writes to L here"
        },
        {
          "Type": "internal",
          "Comment": "Probably writes to H here"
        }
      ]
    },
    {
      "Name": "LD A,(DE)",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(DE)->A"
        }
      ]
    },
    {
      "Name": "DEC DE",
      "Group": "x16/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "Probably writes to E here"
        },
        {
          "Type": "internal",
          "Comment": "Probably writes to D here"
        }
      ]
    },
    {
      "Name": "INC E",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "DEC E",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD E,u8",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8->E"
        }
      ]
    },
    {
      "Name": "RRA",
      "Group": "x8/rsb",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "0",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "JR NZ,i8",
      "Group": "control/br",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "i8"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "i8"
        },
        {
          "Type": "internal",
          "Comment": "modify PC"
        }
      ]
    },
    {
      "Name": "LD HL,u16",
      "Group": "x16/lsm",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower->L"
        },
        {
          "Type": "read",
          "Comment": "u16:upper->H"
        }
      ]
    },
    {
      "Name": "LD (HL+),A",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "A->(HL++)"
        }
      ]
    },
    {
      "Name": "INC HL",
      "Group": "x16/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "Probably writes to L here"
        },
        {
          "Type": "internal",
          "Comment": "Probably writes to H here"
        }
      ]
    },
    {
      "Name": "INC H",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "DEC H",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD H,u8",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8->H"
        }
      ]
    },
    {
      "Name": "DAA",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "-",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "JR Z,i8",
      "Group": "control/br",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "i8"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "i8"
        },
        {
          "Type": "internal",
          "Comment": "modify PC"
        }
      ]
    },
    {
      "Name": "ADD HL,HL",
      "Group": "x16/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "Probably writes to L here"
        },
        {
          "Type": "internal",
          "Comment": "Probably writes to H here"
        }
      ]
    },
    {
      "Name": "LD A,(HL+)",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL++)->A"
        }
      ]
    },
    {
      "Name": "DEC HL",
      "Group": "x16/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "Probably writes to L here"
        },
        {
          "Type": "internal",
          "Comment": "Probably writes to H here"
        }
      ]
    },
    {
      "Name": "INC L",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "DEC L",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD L,u8",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8->L"
        }
      ]
    },
    {
      "Name": "CPL",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "1",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "JR NC,i8",
      "Group": "control/br",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "i8"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "i8"
        },
        {
          "Type": "internal",
          "Comment": "modify PC"
        }
      ]
    },
    {
      "Name": "LD SP,u16",
      "Group": "x16/lsm",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower->SP:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper->SP:upper"
        }
      ]
    },
    {
      "Name": "LD (HL-),A",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "A->(HL--)"
        }
      ]
    },
    {
      "Name": "INC SP",
      "Group": "x16/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "Probably writes to SP:lower here"
        },
        {
          "Type": "internal",
          "Comment": "Probably writes to SP:upper here"
        }
      ]
    },
    {
      "Name": "INC (HL)",
      "Group": "x8/alu",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "DEC (HL)",
      "Group": "x8/alu",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "LD (HL),u8",
      "Group": "x8/lsm",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SCF",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "0",
        "H": "0",
        "C": "1"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "JR C,i8",
      "Group": "control/br",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "i8"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "i8"
        },
        {
          "Type": "internal",
          "Comment": "modify PC"
        }
      ]
    },
    {
      "Name": "ADD HL,SP",
      "Group": "x16/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "Probably writes to L here"
        },
        {
          "Type": "internal",
          "Comment": "Probably writes to H here"
        }
      ]
    },
    {
      "Name": "LD A,(HL-)",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL--)->A"
        }
      ]
    },
    {
      "Name": "DEC SP",
      "Group": "x16/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "Probably writes to SP:lower here"
        },
        {
          "Type": "internal",
          "Comment": "Probably writes to SP:upper here"
        }
      ]
    },
    {
      "Name": "INC A",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "DEC A",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD A,u8",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8->A"
        }
      ]
    },
    {
      "Name": "CCF",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD B,B",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD B,C",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD B,D",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD B,E",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD B,H",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD B,L",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD B,(HL)",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)->B"
        }
      ]
    },
    {
      "Name": "LD B,A",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD C,B",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD C,C",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD C,D",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD C,E",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD C,H",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD C,L",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD C,(HL)",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)->C"
        }
      ]
    },
    {
      "Name": "LD C,A",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD D,B",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD D,C",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD D,D",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD D,E",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD D,H",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD D,L",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD D,(HL)",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)->D"
        }
      ]
    },
    {
      "Name": "LD D,A",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD E,B",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD E,C",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD E,D",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD E,E",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD E,H",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD E,L",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD E,(HL)",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)->E"
        }
      ]
    },
    {
      "Name": "LD E,A",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD H,B",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD H,C",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD H,D",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD H,E",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD H,H",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD H,L",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD H,(HL)",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)->H"
        }
      ]
    },
    {
      "Name": "LD H,A",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD L,B",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD L,C",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD L,D",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD L,E",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD L,H",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD L,L",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD L,(HL)",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)->L"
        }
      ]
    },
    {
      "Name": "LD L,A",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD (HL),B",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "B->(HL)"
        }
      ]
    },
    {
      "Name": "LD (HL),C",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "C->(HL)"
        }
      ]
    },
    {
      "Name": "LD (HL),D",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "D->(HL)"
        }
      ]
    },
    {
      "Name": "LD (HL),E",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "E->(HL)"
        }
      ]
    },
    {
      "Name": "LD (HL),H",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "H->(HL)"
        }
      ]
    },
    {
      "Name": "LD (HL),L",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "L->(HL)"
        }
      ]
    },
    {
      "Name": "HALT",
      "Group": "control/misc",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "This can actually last forever"
        }
      ]
    },
    {
      "Name": "LD (HL),A",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "A->(HL)"
        }
      ]
    },
    {
      "Name": "LD A,B",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD A,C",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD A,D",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD A,E",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD A,H",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD A,L",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD A,(HL)",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)->A"
        }
      ]
    },
    {
      "Name": "LD A,A",
      "Group": "x8/lsm",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADD A,B",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADD A,C",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADD A,D",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADD A,E",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADD A,H",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADD A,L",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADD A,(HL)",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "ADD A,A",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADC A,B",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADC A,C",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADC A,D",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADC A,E",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADC A,H",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADC A,L",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "ADC A,(HL)",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "ADC A,A",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SUB A,B",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SUB A,C",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SUB A,D",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SUB A,E",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SUB A,H",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SUB A,L",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SUB A,(HL)",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SUB A,A",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SBC A,B",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SBC A,C",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SBC A,D",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SBC A,E",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SBC A,H",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SBC A,L",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SBC A,(HL)",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SBC A,A",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "AND A,B",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "AND A,C",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "AND A,D",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "AND A,E",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "AND A,H",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "AND A,L",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "AND A,(HL)",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "AND A,A",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "XOR A,B",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "XOR A,C",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "XOR A,D",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "XOR A,E",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "XOR A,H",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "XOR A,L",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "XOR A,(HL)",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "XOR A,A",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "OR A,B",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "OR A,C",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "OR A,D",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "OR A,E",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "OR A,H",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "OR A,L",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "OR A,(HL)",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "OR A,A",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "CP A,B",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "CP A,C",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "CP A,D",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "CP A,E",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "CP A,H",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "CP A,L",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "CP A,(HL)",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "CP A,A",
      "Group": "x8/alu",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RET NZ",
      "Group": "control/br",
      "TCyclesBranch": 20,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->lower"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->upper"
        },
        {
          "Type": "internal",
          "Comment": "set PC?"
        }
      ]
    },
    {
      "Name": "POP BC",
      "Group": "x16/lsm",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(SP++)->C"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->B"
        }
      ]
    },
    {
      "Name": "JP NZ,u16",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 12,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        }
      ]
    },
    {
      "Name": "JP u16",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        }
      ]
    },
    {
      "Name": "CALL NZ,u16",
      "Group": "control/br",
      "TCyclesBranch": 24,
      "TCyclesNoBranch": 12,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        },
        {
          "Type": "write",
          "Comment": "PC:upper->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "PC:lower->(--SP)"
        }
      ]
    },
    {
      "Name": "PUSH BC",
      "Group": "x16/lsm",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "B->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "C->(--SP)"
        }
      ]
    },
    {
      "Name": "ADD A,u8",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8"
        }
      ]
    },
    {
      "Name": "RST 00h",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "PC:upper->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "PC:lower->(--SP)"
        }
      ]
    },
    {
      "Name": "RET Z",
      "Group": "control/br",
      "TCyclesBranch": 20,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->lower"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->upper"
        },
        {
          "Type": "internal",
          "Comment": "set PC?"
        }
      ]
    },
    {
      "Name": "RET",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(SP++)->lower"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->upper"
        },
        {
          "Type": "internal",
          "Comment": "set PC?"
        }
      ]
    },
    {
      "Name": "JP Z,u16",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 12,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        }
      ]
    },
    {
      "Name": "PREFIX CB",
      "Group": "control/misc",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "probably fetches twice?"
        }
      ]
    },
    {
      "Name": "CALL Z,u16",
      "Group": "control/br",
      "TCyclesBranch": 24,
      "TCyclesNoBranch": 12,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        },
        {
          "Type": "write",
          "Comment": "PC:upper->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "PC:lower->(--SP)"
        }
      ]
    },
    {
      "Name": "CALL u16",
      "Group": "control/br",
      "TCyclesBranch": 24,
      "TCyclesNoBranch": 24,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        },
        {
          "Type": "write",
          "Comment": "PC:upper->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "PC:lower->(--SP)"
        }
      ]
    },
    {
      "Name": "ADC A,u8",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8"
        }
      ]
    },
    {
      "Name": "RST 08h",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "PC:upper->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "PC:lower->(--SP)"
        }
      ]
    },
    {
      "Name": "RET NC",
      "Group": "control/br",
      "TCyclesBranch": 20,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->lower"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->upper"
        },
        {
          "Type": "internal",
          "Comment": "set PC?"
        }
      ]
    },
    {
      "Name": "POP DE",
      "Group": "x16/lsm",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(SP++)->E"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->D"
        }
      ]
    },
    {
      "Name": "JP NC,u16",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 12,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        }
      ]
    },
    {
      "Name": "UNUSED",
      "Group": "unused",
      "TCyclesBranch": 0,
      "TCyclesNoBranch": 0,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      }
    },
    {
      "Name": "CALL NC,u16",
      "Group": "control/br",
      "TCyclesBranch": 24,
      "TCyclesNoBranch": 12,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        },
        {
          "Type": "write",
          "Comment": "PC:upper->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "PC:lower->(--SP)"
        }
      ]
    },
    {
      "Name": "PUSH DE",
      "Group": "x16/lsm",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "D->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "E->(--SP)"
        }
      ]
    },
    {
      "Name": "SUB A,u8",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8"
        }
      ]
    },
    {
      "Name": "RST 10h",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "PC:upper->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "PC:lower->(--SP)"
        }
      ]
    },
    {
      "Name": "RET C",
      "Group": "control/br",
      "TCyclesBranch": 20,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->lower"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->upper"
        },
        {
          "Type": "internal",
          "Comment": "set PC?"
        }
      ]
    },
    {
      "Name": "RETI",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(SP++)->lower"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->upper"
        },
        {
          "Type": "internal",
          "Comment": "set PC?"
        }
      ]
    },
    {
      "Name": "JP C,u16",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 12,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        }
      ]
    },
    {
      "Name": "UNUSED",
      "Group": "unused",
      "TCyclesBranch": 0,
      "TCyclesNoBranch": 0,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      }
    },
    {
      "Name": "CALL C,u16",
      "Group": "control/br",
      "TCyclesBranch": 24,
      "TCyclesNoBranch": 12,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        }
      ],
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        },
        {
          "Type": "internal",
          "Comment": "branch decision?"
        },
        {
          "Type": "write",
          "Comment": "PC:upper->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "PC:lower->(--SP)"
        }
      ]
    },
    {
      "Name": "UNUSED",
      "Group": "unused",
      "TCyclesBranch": 0,
      "TCyclesNoBranch": 0,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      }
    },
    {
      "Name": "SBC A,u8",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8"
        }
      ]
    },
    {
      "Name": "RST 18h",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "PC:upper->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "PC:lower->(--SP)"
        }
      ]
    },
    {
      "Name": "LD (FF00+u8),A",
      "Group": "x8/lsm",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8"
        },
        {
          "Type": "write",
          "Comment": "A->(FF00+u8)"
        }
      ]
    },
    {
      "Name": "POP HL",
      "Group": "x16/lsm",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(SP++)->L"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->H"
        }
      ]
    },
    {
      "Name": "LD (FF00+C),A",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "A->(FF00+C)"
        }
      ]
    },
    {
      "Name": "UNUSED",
      "Group": "unused",
      "TCyclesBranch": 0,
      "TCyclesNoBranch": 0,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      }
    },
    {
      "Name": "UNUSED",
      "Group": "unused",
      "TCyclesBranch": 0,
      "TCyclesNoBranch": 0,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      }
    },
    {
      "Name": "PUSH HL",
      "Group": "x16/lsm",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "H->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "L->(--SP)"
        }
      ]
    },
    {
      "Name": "AND A,u8",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8"
        }
      ]
    },
    {
      "Name": "RST 20h",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "PC:upper->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "PC:lower->(--SP)"
        }
      ]
    },
    {
      "Name": "ADD SP,i8",
      "Group": "x16/alu",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "0",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "i8"
        },
        {
          "Type": "internal",
          "Comment": "Probably writes to SP:lower here"
        },
        {
          "Type": "write",
          "Comment": "Probably writes to SP:upper here"
        }
      ]
    },
    {
      "Name": "JP HL",
      "Group": "control/br",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD (u16),A",
      "Group": "x8/lsm",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        },
        {
          "Type": "write",
          "Comment": "A->(u16)"
        }
      ]
    },
    {
      "Name": "UNUSED",
      "Group": "unused",
      "TCyclesBranch": 0,
      "TCyclesNoBranch": 0,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      }
    },
    {
      "Name": "UNUSED",
      "Group": "unused",
      "TCyclesBranch": 0,
      "TCyclesNoBranch": 0,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      }
    },
    {
      "Name": "UNUSED",
      "Group": "unused",
      "TCyclesBranch": 0,
      "TCyclesNoBranch": 0,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      }
    },
    {
      "Name": "XOR A,u8",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8"
        }
      ]
    },
    {
      "Name": "RST 28h",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "PC:upper->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "PC:lower->(--SP)"
        }
      ]
    },
    {
      "Name": "LD A,(FF00+u8)",
      "Group": "x8/lsm",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8"
        },
        {
          "Type": "read",
          "Comment": "(FF00+u8)->A"
        }
      ]
    },
    {
      "Name": "POP AF",
      "Group": "x16/lsm",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 1,
      "Flags": {
        "Z": "Z",
        "N": "N",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(SP++)->F"
        },
        {
          "Type": "read",
          "Comment": "(SP++)->A"
        }
      ]
    },
    {
      "Name": "LD A,(FF00+C)",
      "Group": "x8/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(FF00+C)->A"
        }
      ]
    },
    {
      "Name": "DI",
      "Group": "control/misc",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "UNUSED",
      "Group": "unused",
      "TCyclesBranch": 0,
      "TCyclesNoBranch": 0,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      }
    },
    {
      "Name": "PUSH AF",
      "Group": "x16/lsm",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "A->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "F->(--SP)"
        }
      ]
    },
    {
      "Name": "OR A,u8",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8"
        }
      ]
    },
    {
      "Name": "RST 30h",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "PC:upper->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "PC:lower->(--SP)"
        }
      ]
    },
    {
      "Name": "LD HL,SP+i8",
      "Group": "x16/alu",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 2,
      "Flags": {
        "Z": "0",
        "N": "0",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "i8"
        },
        {
          "Type": "internal",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD SP,HL",
      "Group": "x16/lsm",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "LD A,(u16)",
      "Group": "x8/lsm",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 3,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u16:lower"
        },
        {
          "Type": "read",
          "Comment": "u16:upper"
        },
        {
          "Type": "read",
          "Comment": "(u16)->A"
        }
      ]
    },
    {
      "Name": "EI",
      "Group": "control/misc",
      "TCyclesBranch": 4,
      "TCyclesNoBranch": 4,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "UNUSED",
      "Group": "unused",
      "TCyclesBranch": 0,
      "TCyclesNoBranch": 0,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      }
    },
    {
      "Name": "UNUSED",
      "Group": "unused",
      "TCyclesBranch": 0,
      "TCyclesNoBranch": 0,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      }
    },
    {
      "Name": "CP A,u8",
      "Group": "x8/alu",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "1",
        "H": "H",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "u8"
        }
      ]
    },
    {
      "Name": "RST 38h",
      "Group": "control/br",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 1,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "internal",
          "Comment": ""
        },
        {
          "Type": "write",
          "Comment": "PC:upper->(--SP)"
        },
        {
          "Type": "write",
          "Comment": "PC:lower->(--SP)"
        }
      ]
    }
  ],
  "CBPrefixed": [
    {
      "Name": "RLC B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RLC C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RLC D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RLC E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RLC H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RLC L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RLC (HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "RLC A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RRC B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RRC C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RRC D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RRC E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RRC H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RRC L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RRC (HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "RRC A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RL B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RL C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RL D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RL E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RL H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RL L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RL (HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "RL A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RR B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RR C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RR D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RR E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RR H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RR L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RR (HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "RR A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SLA B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SLA C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SLA D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SLA E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SLA H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SLA L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SLA (HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SLA A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRA B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRA C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRA D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRA E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRA H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRA L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRA (HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SRA A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SWAP B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SWAP C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SWAP D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SWAP E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SWAP H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SWAP L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SWAP (HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SWAP A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "0"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRL B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRL C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRL D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRL E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRL H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRL L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SRL (HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SRL A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "0",
        "C": "C"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 0,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 0,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 0,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 0,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 0,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 0,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 0,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "BIT 0,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 1,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 1,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 1,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 1,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 1,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 1,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 1,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "BIT 1,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 2,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 2,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 2,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 2,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 2,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 2,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 2,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "BIT 2,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 3,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 3,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 3,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 3,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 3,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 3,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 3,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "BIT 3,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 4,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 4,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 4,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 4,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 4,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 4,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 4,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "BIT 4,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 5,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 5,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 5,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 5,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 5,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 5,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 5,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "BIT 5,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 6,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 6,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 6,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 6,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 6,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 6,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 6,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "BIT 6,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 7,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 7,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 7,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 7,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 7,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 7,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "BIT 7,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 12,
      "TCyclesNoBranch": 12,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "BIT 7,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "Z",
        "N": "0",
        "H": "1",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 0,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 0,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 0,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 0,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 0,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 0,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 0,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "RES 0,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 1,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 1,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 1,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 1,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 1,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 1,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 1,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "RES 1,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 2,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 2,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 2,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 2,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 2,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 2,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 2,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "RES 2,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 3,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 3,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 3,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 3,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 3,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 3,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 3,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "RES 3,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 4,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 4,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 4,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 4,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 4,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 4,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 4,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "RES 4,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 5,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 5,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 5,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 5,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 5,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 5,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 5,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "RES 5,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 6,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 6,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 6,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 6,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 6,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 6,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 6,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "RES 6,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 7,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 7,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 7,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 7,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 7,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 7,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "RES 7,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "RES 7,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 0,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 0,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 0,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 0,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 0,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 0,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 0,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SET 0,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 1,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 1,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 1,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 1,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 1,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 1,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 1,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SET 1,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 2,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 2,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 2,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 2,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 2,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 2,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 2,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SET 2,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 3,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 3,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 3,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 3,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 3,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 3,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 3,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SET 3,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 4,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 4,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 4,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 4,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 4,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 4,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 4,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SET 4,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 5,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 5,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 5,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 5,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 5,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 5,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 5,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SET 5,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 6,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 6,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 6,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 6,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 6,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 6,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 6,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SET 6,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 7,B",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 7,C",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 7,D",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 7,E",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 7,H",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 7,L",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    },
    {
      "Name": "SET 7,(HL)",
      "Group": "x8/rsb",
      "TCyclesBranch": 16,
      "TCyclesNoBranch": 16,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        },
        {
          "Type": "read",
          "Comment": "(HL)"
        },
        {
          "Type": "write",
          "Comment": "(HL)"
        }
      ]
    },
    {
      "Name": "SET 7,A",
      "Group": "x8/rsb",
      "TCyclesBranch": 8,
      "TCyclesNoBranch": 8,
      "Length": 2,
      "Flags": {
        "Z": "-",
        "N": "-",
        "H": "-",
        "C": "-"
      },
      "TimingNoBranch": [
        {
          "Type": "fetch",
          "Comment": "(0xCB)"
        },
        {
          "Type": "fetch",
          "Comment": ""
        }
      ]
    }
  ]
}