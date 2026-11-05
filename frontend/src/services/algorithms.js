/**
 * algorithms.js
 * Hand-rolled sorting and search algorithms matching backend logic
 */

export function binarySearch(arr, targetValue, key = "title") {
  let low = 0;
  let high = arr.length - 1;
  let comparisons = 0;
  const target = String(targetValue).toLowerCase();

  while (low <= high) {
    comparisons++;
    const mid = Math.floor((low + high) / 2);
    const midVal = String(arr[mid][key] || "").toLowerCase();

    if (midVal === target) {
      return { index: mid, item: arr[mid], comparisons };
    } else if (midVal < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return { index: -1, item: null, comparisons };
}

export function linearSearch(arr, targetValue, key = "title") {
  let comparisons = 0;
  const target = String(targetValue).toLowerCase();

  for (let i = 0; i < arr.length; i++) {
    comparisons++;
    const val = String(arr[i][key] || "").toLowerCase();
    if (val.includes(target)) {
      return { index: i, item: arr[i], comparisons };
    }
  }

  return { index: -1, item: null, comparisons };
}

export function insertionSort(arr, key = "priority", ascending = true) {
  const list = [...arr];
  const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };

  for (let i = 1; i < list.length; i++) {
    const current = list[i];
    let j = i - 1;

    const getVal = (item) => {
      if (key === "priority") return priorityWeight[item.priority] || 0;
      return item[key] || "";
    };

    while (j >= 0 && (ascending ? getVal(list[j]) > getVal(current) : getVal(list[j]) < getVal(current))) {
      list[j + 1] = list[j];
      j--;
    }
    list[j + 1] = current;
  }

  return list;
}
