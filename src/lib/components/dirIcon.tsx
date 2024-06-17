import { defineComponent } from "vue";

export const DirIcon = defineComponent({
  name: "DirIcon",
  setup() {
    return () => (
      <svg
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="10594"
        width="48"
        height="48"
      >
        <path
          d="M918.673 883H104.327C82.578 883 65 867.368 65 848.027V276.973C65 257.632 82.578 242 104.327 242h814.346C940.422 242 958 257.632 958 276.973v571.054C958 867.28 940.323 883 918.673 883z"
          fill="#FFE9B4"
          p-id="10595"
        ></path>
        <path
          d="M512 411H65V210.37C65 188.597 82.598 171 104.371 171h305.92c17.4 0 32.71 11.334 37.681 28.036L512 411z"
          fill="#FFB02C"
          p-id="10596"
        ></path>
        <path
          d="M918.673 883H104.327C82.578 883 65 865.42 65 843.668V335.332C65 313.58 82.578 296 104.327 296h814.346C940.422 296 958 313.58 958 335.332v508.336C958 865.32 940.323 883 918.673 883z"
          fill="#FFCA28"
          p-id="10597"
        ></path>
      </svg>
    );
  },
});