require "./spec_helper"

describe For do
  it "using works fine on its own" do
    ary = (1..10).to_a

    (using ary).should eq [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  end

  it "can iterate an array" do
    r = [] of Int32
    a = [1, 2, 3]
    iterate(x, a) { r << x }
    r.size.should eq 3
    r.last.should eq 3
  end

  it "can iterate a hash, and can operate with the \"using\" syntax" do
    h = {"a" => 1,
         "b" => 2,
         "c" => 3}

    keys = ""
    values = ""

    iterate(key, value, using h) do
      keys = keys + key
      values = values + value.to_s
    end

    keys.should eq "abc"
    values.should eq "123"
  end

  it "can use the C style for loop, using strings for the init, test, and update sections" do
    t = -1
    for(%(t = 0), %( t < 10), %(t += 1)) do
      # NOP
    end
    t.should eq 10
  end

  it "can use the C style for loop, using Procs for the init, test, and update sections" do
    t = -1
    for(->{ t = 0 }, ->{ t < 10 }, ->{ t += 1 }) do
      # NOP
    end
    t.should eq 10
  end

  it "can assign a C style for loop to a variable" do
    ary = (1..10).to_a

    t = uninitialized Int32
    transform = for(->{ t = 0 }, ->{ t < 10 }, ->{ t += 1 }, run: false) { ary[t] = ary[t] * ary[t] }

    for(%(count = 0), %(count < 3), %(count += 1)) do
      transform.call
    end

    ary.should eq [1, 256, 6561, 65536, 390625, 1679616, 5764801, 16777216, 43046721, 100000000]
  end
end
