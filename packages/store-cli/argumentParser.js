const ENC = `'`;

export const parser = (arg) => {
  let isInEnc = false;
  let isBeingEscaped = false;
  let buffer = "";

  let args = [];

  for (let i = 0; i < arg.length; i++) {
    const char = arg.charAt(i);

    if (char == " ") {
      if (isInEnc) buffer += char;
      else if (isBeingEscaped) return [`Unknown escape \${char}`, undefined];
      continue;
    }

    if (char == ENC) {
      if (isBeingEscaped) {
        buffer += ENC;
        isBeingEscaped = false;
      } else {
        if (isInEnc) {
          args.push(buffer);
          buffer = "";
          isInEnc = false;
        } else {
          isInEnc = true;
        }
      }
    } else if (char == "\\") {
      if (!isInEnc) {
        return [
          `Expected ${ENC}, found '${char}'; values must be enclosed in ${ENC} ${ENC}`,
          undefined,
        ];
      }

      if (isBeingEscaped) {
        buffer += "\\";
        isBeingEscaped = false;
      } else isBeingEscaped = true;
    } else {
      if (!isInEnc) {
        return [
          `Expected ${ENC}, found '${char}'; values must be enclosed in ${ENC} ${ENC}`,
          undefined,
        ];
      }
      if (isBeingEscaped) return [`Unknown escape '\\${char}'`, undefined];

      buffer += char;
    }
  }

  return [undefined, args];
};
