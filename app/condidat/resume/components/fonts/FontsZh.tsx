
const FontsZh = () => (
  <>
    <style jsx global>{`
      @font-face {
        font-family: "NotoSansSC";
        src: url("/fonts/NotoSansSC-Regular.ttf");
      }
      @font-face {
        font-family: "NotoSansSC";
        src: url("/fonts/NotoSansSC-Bold.ttf");
        font-weight: bold;
      }
      .font-zh {
        font-family: "NotoSansSC", sans-serif;
      }
    `}</style>
  </>
);

export default FontsZh;
